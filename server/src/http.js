export class HttpError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export const bad = (message, code = 'VALIDATION') => new HttpError(400, code, message);
export const conflict = (message, code = 'CONFLICT') => new HttpError(409, code, message);

export function asInt(value, { min = -Infinity, max = Infinity, name = 'значение' } = {}) {
  if (typeof value === 'string' && /^-?\d+$/.test(value.trim())) value = Number(value);
  if (!Number.isInteger(value) || value < min || value > max) {
    throw bad(`Некорректное ${name}`);
  }
  return value;
}

export function errorHandler(err, req, res, _next) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: { code: err.code, message: err.message } });
  }
  if (err?.type === 'entity.parse.failed' || err instanceof SyntaxError) {
    return res.status(400).json({ error: { code: 'BAD_JSON', message: 'Не удалось разобрать запрос' } });
  }
  if (err?.type === 'entity.too.large') {
    return res.status(413).json({ error: { code: 'TOO_LARGE', message: 'Слишком большой запрос' } });
  }
  console.error(err);
  res.status(500).json({ error: { code: 'INTERNAL', message: 'Что-то пошло не так на сервере. Попробуйте ещё раз.' } });
}
