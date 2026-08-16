// utils/validation.ts

export const isValidEmail = (value: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

export const isMinLength = (value: string, min: number): boolean =>
  value.trim().length >= min;

export const isMatch = (a: string, b: string): boolean => a === b;

export const isValidColombianPhone = (value: string): boolean =>
  /^\+57\d{10}$/.test(value.replace(/\s/g, ''));

export interface LoginErrors {
  email?: string;
  password?: string;
}

export interface RegisterErrors {
  nombres?: string;
  apellidos?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  telefono?: string;
}

export const validateLoginForm = ({
  email,
  password,
}: {
  email: string;
  password: string;
}): LoginErrors => {
  const errors: LoginErrors = {};
  if (!isValidEmail(email))
    errors.email = 'Ingresa un correo electrónico válido';
  if (!isMinLength(password, 1))
    errors.password = 'La contraseña es requerida';
  return errors;
};

export const validateRegisterForm = ({
  nombres,
  apellidos,
  email,
  password,
  confirmPassword,
  telefono,
}: {
  nombres: string;
  apellidos: string;
  email: string;
  password: string;
  confirmPassword: string;
  telefono: string;
}): RegisterErrors => {
  const errors: RegisterErrors = {};
  if (!isMinLength(nombres, 2))
    errors.nombres = 'Ingresa tu nombre (mín. 2 caracteres)';
  if (!isMinLength(apellidos, 2))
    errors.apellidos = 'Ingresa tus apellidos (mín. 2 caracteres)';
  if (!isValidEmail(email))
    errors.email = 'Correo electrónico no válido';
  if (!isMinLength(password, 8))
    errors.password = 'La contraseña debe tener mínimo 8 caracteres';
  if (!isMatch(password, confirmPassword))
    errors.confirmPassword = 'Las contraseñas no coinciden';
  if (!isValidColombianPhone(telefono))
    errors.telefono = 'Ingresa un número válido (+57 + 10 dígitos)';
  return errors;
};