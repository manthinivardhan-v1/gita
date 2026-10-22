"""Pre-render every narration line of the site to MP3 with Piper neural TTS.

Usage (from the repo root):
    pip install piper-tts
    python tools/generate_voices.py --voices /path/to/piper/voices [--only v-11-32] [--workers 8]

Voices used (download .onnx + .onnx.json from huggingface.co/rhasspy/piper-voices):
    hi_IN-pratham-medium                 (CC BY-NC-SA 4.0)  Hindi + Sanskrit, every character
    en_GB-northern_english_male-medium   (CC BY-SA 4.0)     English — Krishna, Dhritarashtra
    en_US-ryan-high                      (CC BY-NC-SA 4.0)  English — Arjuna, Sanjaya

Output: audio/{en,hi,sa}/<key>.mp3 where key is v-<ch>-<verse>, c-<ch>, p-<n> or end.
Each character gets their own pitch, pace and space, so Krishna sounds deep and
unhurried with a temple-like echo, Arjuna younger and brighter, Sanjaya a narrator.
"""
import argparse, json, os, re, subprocess, sys, tempfile, wave
from multiprocessing import Pool

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'audio')

PROLOGUE_EN = [
    "Before Time Was Counted. At the turning of the ages, as the Dvapara Yuga wanes into Kali, the heavens hold their breath above a single field on Earth. Kurukshetra, the field of dharma.",
    "Two Armies, One Blood. Eighteen vast armies stand face to face. On one side the Kauravas, led by Duryodhana. On the other, the five Pandava brothers. They are cousins. The same blood, ready to be spilled.",
    "The Blind King. Far away in the palace of Hastinapura sits the blind king Dhritarashtra. The sage Vyasa has granted his charioteer Sanjaya divine sight, so that he may see every moment of the war, and tell it.",
    "The Conches Roar. Bhishma blows his conch like a lion's roar. Then Krishna lifts Panchajanya, and Arjuna sounds Devadatta. The sound tears through earth and sky, and the hearts of the Kauravas tremble.",
    "Between the Two Armies. Arjuna, the greatest archer of the age, asks his charioteer, Krishna himself, to drive the chariot into the space between the two armies, so he may look upon those he must fight.",
    "The Bow Slips. He sees grandfathers, teachers, uncles, brothers, sons and friends. His limbs fail, his mouth runs dry, and the mighty bow Gandiva slips from his hand. He cannot fight.",
    "The Song of God. And there, in the silence between two armies, while time itself stands still, the Lord of the universe smiles, and begins to sing. This is the Bhagavad Gita.",
]
PROLOGUE_HI = [
    "जब समय की गिनती भी नहीं थी। युगों के संधिकाल में, जब द्वापर युग कलियुग में ढल रहा है, तब पूरा आकाश पृथ्वी के एक ही क्षेत्र पर अपनी साँस रोके खड़ा है। कुरुक्षेत्र, धर्म का क्षेत्र।",
    "दो सेनाएँ, एक ही रक्त। अठारह विशाल सेनाएँ आमने सामने खड़ी हैं। एक ओर दुर्योधन के नेतृत्व में कौरव। दूसरी ओर पाँच पाण्डव भाई। वे सब भाई हैं, एक ही रक्त, जो अब बहने को तैयार है।",
    "अंधे राजा। दूर हस्तिनापुर के महल में अंधे राजा धृतराष्ट्र बैठे हैं। महर्षि व्यास ने उनके सारथी संजय को दिव्य दृष्टि दी है, ताकि वह युद्ध का हर क्षण देख सके, और सुना सके।",
    "शंखनाद। भीष्म सिंह की दहाड़ जैसा शंख बजाते हैं। फिर श्रीकृष्ण पाञ्चजन्य उठाते हैं, और अर्जुन देवदत्त बजाते हैं। वह नाद धरती और आकाश को चीर देता है, और कौरवों के हृदय काँप उठते हैं।",
    "दोनों सेनाओं के बीच। युग के सबसे महान धनुर्धर अर्जुन अपने सारथी, स्वयं श्रीकृष्ण से कहते हैं, कि रथ को दोनों सेनाओं के बीच खड़ा करें, ताकि वह देख सकें कि उन्हें किनसे युद्ध करना है।",
    "गाण्डीव गिर पड़ता है। वह पितामह, गुरु, चाचा, भाई, पुत्र और मित्रों को देखते हैं। उनके अंग शिथिल हो जाते हैं, मुख सूख जाता है, और महान धनुष गाण्डीव उनके हाथ से गिर पड़ता है। वह युद्ध नहीं कर सकते।",
    "भगवान का गीत। और वहीं, दो सेनाओं के बीच के मौन में, जब समय स्वयं थम गया है, ब्रह्माण्ड के स्वामी मुस्कुराते हैं, और गाना आरम्भ करते हैं। यही है श्रीमद्भगवद्गीता।",
]
END_EN = "Where Krishna Is, There Is Victory. Arjuna rises, his delusion destroyed, his memory restored. He lifts Gandiva once more. Sanjaya's hair stands on end as he remembers the wondrous form of Hari. Wherever there is Krishna, the Lord of Yoga, and Arjuna, the archer, there are fortune, victory, glory and righteousness. Om Tat Sat."
END_HI = "जहाँ कृष्ण हैं, वहीं विजय है। अर्जुन उठ खड़े होते हैं, उनका मोह नष्ट हो गया है, स्मृति लौट आई है। वह फिर से गाण्डीव उठाते हैं। हरि के उस अद्भुत रूप को याद करके संजय रोमांचित हो उठते हैं। जहाँ योगेश्वर श्रीकृष्ण हैं, और जहाँ धनुर्धर अर्जुन हैं, वहीं श्री, विजय, विभूति और अचल नीति है। ॐ तत् सत्।"

HI_NUM = ['', 'एक', 'दो', 'तीन', 'चार', 'पाँच', 'छह', 'सात', 'आठ', 'नौ', 'दस', 'ग्यारह', 'बारह', 'तेरह', 'चौदह', 'पंद्रह', 'सोलह', 'सत्रह', 'अठारह']

# per character: piper model (by language), pitch factor, pace (length_scale), echo
STYLE = {
    'K': dict(hi='hi_IN-pratham-medium', en='en_GB-northern_english_male-medium', pitch_hi=0.94, pitch_en=0.95, pace=1.12,
              fx='equalizer=f=140:t=q:w=1:g=3,aecho=0.8:0.55:60|130|260:0.22|0.14|0.07'),
    'A': dict(hi='hi_IN-pratham-medium', en='en_US-ryan-high', pitch_hi=1.12, pitch_en=1.0, pace=1.0,
              fx='aecho=0.8:0.4:45:0.1'),
    'S': dict(hi='hi_IN-pratham-medium', en='en_US-ryan-high', pitch_hi=1.05, pitch_en=0.93, pace=1.05,
              fx='aecho=0.8:0.45:50|100:0.12|0.06'),
    'D': dict(hi='hi_IN-pratham-medium', en='en_GB-northern_english_male-medium', pitch_hi=0.88, pitch_en=0.88, pace=1.15,
              fx='aecho=0.8:0.5:70:0.15'),
}


def sanskrit_for_tts(sa):
    s = sa.replace('ऽ', '').replace('।।', '।')
    s = re.sub(r'\s*।\s*', ', ', s).strip(' ,\n')
    return s.replace('\n', ' ') + '।'


def jobs(data):
    J = []
    for v in data['verses']:
        ch, n, spk, sa, tr, en, hi = v[:7]
        key = f'v-{ch}-{n}'
        J += [(key, 'en', spk, en), (key, 'hi', spk, hi), (key, 'sa', spk, sanskrit_for_tts(sa))]
    for c in data['chapters']:
        J += [(f"c-{c['n']}", 'en', 'S', f"Chapter {c['n']}. {c['en']}. {c['meaning']}."),
              (f"c-{c['n']}", 'hi', 'S', f"अध्याय {HI_NUM[c['n']]}। {c['sa']}।")]
    for i, (e, h) in enumerate(zip(PROLOGUE_EN, PROLOGUE_HI), 1):
        J += [(f'p-{i}', 'en', 'S', e), (f'p-{i}', 'hi', 'S', h)]
    J += [('end', 'en', 'S', END_EN), ('end', 'hi', 'S', END_HI)]
    return J


_voices = {}
VOICE_DIR = None


def voice(name):
    from piper import PiperVoice
    if name not in _voices:
        _voices[name] = PiperVoice.load(os.path.join(VOICE_DIR, name + '.onnx'))
    return _voices[name]


def render(job):
    from piper import SynthesisConfig
    key, lang, spk, text = job
    out = os.path.join(OUT, lang, key + '.mp3')
    if os.path.exists(out):
        return key, lang, 'skip'
    st = STYLE[spk]
    vlang = 'en' if lang == 'en' else 'hi'
    pitch = st['pitch_en'] if vlang == 'en' else st['pitch_hi']
    v = voice(st[vlang])
    sr = v.config.sample_rate
    with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as tmp:
        path = tmp.name
    try:
        with wave.open(path, 'wb') as w:
            v.synthesize_wav(text.replace('--', ', '), w, syn_config=SynthesisConfig(length_scale=st['pace'], noise_scale=0.6, noise_w_scale=0.75))
        af = f"asetrate={int(sr * pitch)},aresample={sr},atempo={1 / pitch:.4f},{st['fx']},loudnorm=I=-17:TP=-1.5:LRA=11,apad=pad_dur=0.25"
        os.makedirs(os.path.dirname(out), exist_ok=True)
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', path, '-af', af, '-ac', '1', '-ar', '22050',
                        '-c:a', 'libmp3lame', '-b:a', '32k', out], check=True)
    finally:
        os.unlink(path)
    return key, lang, 'ok'


def init(vdir):
    global VOICE_DIR
    VOICE_DIR = vdir
    # one thread per worker: the pool already uses every core
    import onnxruntime as ort
    _Session = ort.InferenceSession

    def single_threaded(*args, **kw):
        opts = kw.get('sess_options') or ort.SessionOptions()
        opts.intra_op_num_threads = 1
        opts.inter_op_num_threads = 1
        kw['sess_options'] = opts
        return _Session(*args, **kw)
    ort.InferenceSession = single_threaded


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--voices', required=True)
    ap.add_argument('--workers', type=int, default=os.cpu_count())
    ap.add_argument('--only', help='comma separated keys, e.g. v-2-47,p-1')
    a = ap.parse_args()
    data = json.load(open(os.path.join(ROOT, 'data', 'gita.json')))
    J = jobs(data)
    if a.only:
        keep = set(a.only.split(','))
        J = [j for j in J if j[0] in keep]
    done = 0
    with Pool(a.workers, initializer=init, initargs=(a.voices,)) as pool:
        for key, lang, status in pool.imap_unordered(render, J, chunksize=4):
            done += 1
            if done % 100 == 0 or done == len(J):
                print(f'{done}/{len(J)}', flush=True)
    print('done')


if __name__ == '__main__':
    main()
