# qr-ascii

A tiny serverless API for generating **minimum-size QR codes** and returning them as **ASCII art**
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fxolyn%2Fqr-ascii)

## Endpoints

### `GET /api/qr`

Generate an ASCII QR code using query parameters.

**Query parameters**

| Name     | Type                   | Required | Default | Description                                                                                                 |
| -------- | ---------------------- | -------: | ------- | ----------------------------------------------------------------------------------------------------------- |
| `text`   | string                 |        ✅ | —       | Content encoded in the QR code. Library auto-selects the smallest possible QR **version** for this payload. |
| `ecc`    | `L` | `M` | `Q` | `H`  |        ❌ | `L`     | Error-correction level. Lower is smaller.                                                                   |
| `margin` | number (0–8)           |        ❌ | `2`     | Quiet zone size in **modules** around the QR.                                                               |
| `invert` | boolean (`1/true/yes`) |        ❌ | `false` | Swap dark/light blocks (useful for dark terminals).                                                         |

**Response**

* `200 OK` with `text/plain; charset=utf-8` — ASCII QR art
* Cache headers: `Cache-Control: public, max-age=31536000, immutable`

**Examples**

```
GET /api/qr?text=HELLO%20WORLD
GET /api/qr?text=https%3A%2F%2Fexample.com&ecc=L&margin=4
GET /api/qr?text=ABC-123&invert=1
```

---

### `POST /api/qr`

Same as `GET`, but parameters are provided as JSON (useful for longer text).

**Body (application/json)**

```json
{
  "text": "This can be a very very long text...",
  "ecc": "M",
  "margin": 2,
  "invert": false
}
```

**Response**

* `200 OK` with `text/plain` ASCII QR art
* Same cache headers as `GET`

**cURL**

```bash
curl -X POST "https://<your-project>.vercel.app/api/qr" \
  -H "Content-Type: application/json" \
  -d '{"text":"Your text here","ecc":"M","margin":2}'
```

---

## Behavior & Notes

* **Minimum size:** The generator sets `typeNumber=0` so the library picks the **smallest QR version** that fits the data.
* **Mode optimization:** If `text` matches the QR **Alphanumeric** charset (`0–9 A–Z space $%*+-./:`), the API forces Alphanumeric mode (typically yields a smaller version). Otherwise, it uses Byte mode.
* **ASCII rendering:** Each dark module is `██`, each light module is two spaces. This keeps aspect ratio square in most monospace fonts.
* **Quiet zone:** `margin` is applied in module units on all sides.
* **Character case:** For alphanumeric optimization, the input is converted to uppercase internally (QR data is case-insensitive for this mode).
* **Reproducibility**: This API is stateless and deterministic for the same inputs. You can safely cache responses client-side keyed by the full URL (including query string).
---

## Limits & Recommendations

* **Payload size:** Keep `text` reasonably small; extremely long strings will increase QR version and ASCII size.
* **Terminals/Fonts:** Use a monospace font. If the image looks “light on dark”, pass `invert=1`.
* **CORS:** If calling from other origins, add `Access-Control-Allow-Origin: *` (optional enhancement).
* **Error correction:** Prefer `L` for smallest codes; increase to `M/Q/H` only if you need robustness for scanning from noisy media.


## License
MIT


