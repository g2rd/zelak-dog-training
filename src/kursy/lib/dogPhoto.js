/**
 * Zdjęcie psa zmniejszane w przeglądarce przed wysłaniem.
 *
 * Zdjęcie z telefonu waży 3–8 MB, a trenerowi wystarczy miniatura, po której
 * odróżni psy na liście. 800 px w JPEG to zwykle 80–150 kB — szybciej się
 * wysyła po komórce i nie zapycha magazynu.
 */

export const PHOTO_MAX_SIDE = 800

/** Wymiary po zmniejszeniu tak, by dłuższy bok nie przekraczał `max`. */
export function fitWithin(width, height, max = PHOTO_MAX_SIDE) {
  const scale = Math.min(1, max / Math.max(width, height))
  return { width: Math.round(width * scale), height: Math.round(height * scale) }
}

/** Obraz z pliku. `createImageBitmap` obraca zdjęcie według EXIF, <img> jako zapas. */
async function decode(file) {
  if (typeof createImageBitmap === 'function') {
    try {
      return await createImageBitmap(file, { imageOrientation: 'from-image' })
    } catch {
      // Starsze Safari nie zna opcji — niżej zwykły <img>.
    }
  }
  const url = URL.createObjectURL(file)
  try {
    const img = new Image()
    img.src = url
    await img.decode()
    return img
  } finally {
    URL.revokeObjectURL(url)
  }
}

/** Plik ze zdjęciem → JPEG o dłuższym boku najwyżej 800 px. */
export async function shrinkPhoto(file) {
  const image = await decode(file)
  const { width, height } = fitWithin(image.width, image.height)
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  canvas.getContext('2d').drawImage(image, 0, 0, width, height)
  image.close?.()
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Nie udało się przetworzyć zdjęcia.'))),
      'image/jpeg',
      0.85,
    ),
  )
}
