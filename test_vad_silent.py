import io
import json
import urllib.request
import numpy as np
import soundfile as sf

wave = np.zeros(48000, dtype=np.float32)
buf = io.BytesIO()
sf.write(buf, wave, 16000, format='WAV')
audio_bytes = buf.getvalue()

boundary = '----WebKitFormBoundarySilent123'

def encode_field(name, value):
    return (
        f'--{boundary}\r\n'
        f'Content-Disposition: form-data; name="{name}"\r\n\r\n'
        f'{value}\r\n'
    ).encode('utf-8')

def encode_file(name, filename, content, content_type='audio/wav'):
    return (
        f'--{boundary}\r\n'
        f'Content-Disposition: form-data; name="{name}"; filename="{filename}"\r\n'
        f'Content-Type: {content_type}\r\n\r\n'
    ).encode('utf-8') + content + b'\r\n'

body = (
    encode_file('file', 'silent.wav', audio_bytes) +
    encode_field('text', 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ') +
    f'--{boundary}--\r\n'.encode('utf-8')
)

req = urllib.request.Request(
    'http://127.0.0.1:8000/api/v1/tajweed/analyze',
    data=body,
    headers={'Content-Type': f'multipart/form-data; boundary={boundary}'}
)

with urllib.request.urlopen(req) as res:
    result = json.loads(res.read().decode('utf-8'))
    print("Silent Audio Analysis Result:")
    print(json.dumps(result, indent=2, ensure_ascii=False))
