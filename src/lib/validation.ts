/**
 * Validación del formulario de inscripción y de sponsoreo.
 *
 * Son funciones puras que devuelven los errores por campo, para poder probarlas
 * sin montar el formulario y para que el componente sólo se ocupe de mostrarlos.
 */

export type RegistrationKind = 'equipo' | 'sponsor';

export type RegistrationForm = {
  name: string;
  email: string;
  /** Nombre del equipo o de la marca, según el tipo. */
  organization: string;
  message: string;
};

export type FormErrors = Partial<Record<keyof RegistrationForm, string>>;

export const EMPTY_FORM: RegistrationForm = {
  name: '',
  email: '',
  organization: '',
  message: '',
};

/**
 * Validación de mail deliberadamente laxa: pide algo antes de la arroba, algo
 * después y un punto en el dominio. Las expresiones regulares más estrictas
 * terminan rechazando direcciones válidas, que es un error mucho más caro que
 * dejar pasar una inválida en un formulario sin backend.
 */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateRegistration(form: RegistrationForm, kind: RegistrationKind): FormErrors {
  const errors: FormErrors = {};

  if (form.name.trim().length < 2) {
    errors.name = 'Escribí tu nombre.';
  }

  if (form.email.trim().length === 0) {
    errors.email = 'Necesitamos un mail para contestarte.';
  } else if (!EMAIL_PATTERN.test(form.email.trim())) {
    errors.email = 'Ese mail no parece válido.';
  }

  if (form.organization.trim().length < 2) {
    errors.organization =
      kind === 'equipo' ? 'Poné el nombre del equipo.' : 'Poné el nombre de la marca.';
  }

  if (form.message.trim().length > 500) {
    errors.message = 'Máximo 500 caracteres.';
  }

  return errors;
}

/** `true` cuando no quedó ningún error. */
export function isValid(errors: FormErrors): boolean {
  return Object.keys(errors).length === 0;
}
