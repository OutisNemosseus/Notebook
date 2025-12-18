// sineWave.py.js - 正弦波叠加

export const META = {
  name: 'sineWave',
  title: 'Sine Wave Superposition',
  description: '多个正弦波的叠加效果'
};

export const FUNCTION_NAME = 'generate_sine_wave';

export const CODE = `
import numpy as np
import io, base64
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

def generate_sine_wave(freq1, freq2, amp1, amp2, phase):
    x = np.linspace(0, 4 * np.pi, 1000)
    y1 = amp1 * np.sin(freq1 * x)
    y2 = amp2 * np.sin(freq2 * x + phase)
    y = y1 + y2

    fig, ax = plt.subplots(figsize=(6, 3), dpi=150)
    ax.plot(x, y1, 'b-', alpha=0.3, label='Wave 1')
    ax.plot(x, y2, 'r-', alpha=0.3, label='Wave 2')
    ax.plot(x, y, 'k-', linewidth=2, label='Sum')
    ax.set_xlim(0, 4 * np.pi)
    ax.set_ylim(-4, 4)
    ax.legend()
    ax.grid(True, alpha=0.3)

    buf = io.BytesIO()
    fig.savefig(buf, format="png", bbox_inches="tight", pad_inches=0.1)
    plt.close(fig)
    buf.seek(0)
    img_b64 = base64.b64encode(buf.read()).decode("ascii")
    return "data:image/png;base64," + img_b64
`;

export const GUI = `
# @gui-start
# @gui freq1: slider(0.5, 5, 0.5, 1) "频率 1"
# @gui freq2: slider(0.5, 5, 0.5, 2) "频率 2"
# @gui amp1: slider(0, 2, 0.1, 1) "振幅 1"
# @gui amp2: slider(0, 2, 0.1, 1) "振幅 2"
# @gui phase: slider(0, 6.28, 0.1, 0) "相位差"
# @gui-end
`;

export const DOWNLOAD = `
# @download-start
# @download png: image/png "📥 PNG"
# @download jpg: image/jpeg "📥 JPG"
# @download-end
`;
