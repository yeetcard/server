import { z } from 'zod';

const hexColorRegex = /^#?[0-9A-Fa-f]{6}$/;

const passRequestSchema = z.object({
  cardName: z.string().min(1, 'cardName is required'),
  barcodeData: z.string().min(1, 'barcodeData is required'),
  barcodeFormat: z.enum(['QR', 'Code128', 'PDF417', 'Aztec'], {
    errorMap: () => ({ message: 'barcodeFormat must be one of: QR, Code128, PDF417, Aztec' }),
  }),
  foregroundColor: z
    .string()
    .regex(hexColorRegex, 'foregroundColor must be a valid hex color')
    .optional(),
  backgroundColor: z
    .string()
    .regex(hexColorRegex, 'backgroundColor must be a valid hex color')
    .optional(),
  labelColor: z
    .string()
    .regex(hexColorRegex, 'labelColor must be a valid hex color')
    .optional(),
  logoText: z.string().optional(),
});

/**
 * Validate pass generation request body.
 */
export function validatePassRequest(req, res, next) {
  const result = passRequestSchema.safeParse(req.body);

  if (!result.success) {
    const firstError = result.error.errors[0];
    return res.status(400).json({
      error: 'validation_error',
      message: firstError.message,
      field: firstError.path[0],
    });
  }

  req.validatedBody = result.data;
  next();
}

export { passRequestSchema };
