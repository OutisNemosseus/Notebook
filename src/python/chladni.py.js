// chladni.py.js - Chladni 图案

export const META = {
  name: 'chladni',
  title: 'Chladni Patterns',
  description: 'Chladni 图案可视化 - 振动模式的节点线'
};

export const FUNCTION_NAME = 'generate_chladni_general';

export const CODE = `
import numpy as np
import io, base64
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

def generate_chladni_general(n, m, a, b, N=300):
    x = np.linspace(0.0, 1.0, N)
    y = np.linspace(0.0, 1.0, N)
    X, Y = np.meshgrid(x, y)

    Z = a * np.sin(np.pi * n * X) * np.sin(np.pi * m * Y) + \\
        b * np.sin(np.pi * m * X) * np.sin(np.pi * n * Y)

    fig, ax = plt.subplots(figsize=(4, 4), dpi=150)
    ax.contour(X, Y, Z, levels=[0.0], linewidths=0.6)
    ax.set_aspect("equal")
    ax.axis("off")

    buf = io.BytesIO()
    fig.savefig(buf, format="png", bbox_inches="tight", pad_inches=0)
    plt.close(fig)
    buf.seek(0)
    img_b64 = base64.b64encode(buf.read()).decode("ascii")
    return "data:image/png;base64," + img_b64
`;

export const GUI = `
# @gui-start
# @gui a: slider(-10, 10, 0.5, 1) "系数 a"
# @gui n: slider(0, 10, 1, 2) "频率 n"
# @gui m: slider(0, 10, 1, 7) "频率 m"
# @gui b: slider(-10, 10, 0.5, 1) "系数 b"
# @gui-end
`;

export const DOWNLOAD = `
# @download-start
# @download png: image/png "📥 PNG"
# @download jpg: image/jpeg "📥 JPG"
# @download webp: image/webp "📥 WebP"
# @download-end
`;
