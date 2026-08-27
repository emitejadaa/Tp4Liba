import { describe, expect, it } from 'vitest';
import type { RegistrationForm } from './validation';
import { EMPTY_FORM, isValid, validateRegistration } from './validation';

const valid: RegistrationForm = {
  name: 'Emiliano',
  email: 'emi@liba.com.ar',
  organization: 'Los Halcones',
  message: 'Somos cinco y queremos jugar.',
};

describe('validateRegistration', () => {
  it('acepta un formulario completo', () => {
    expect(validateRegistration(valid, 'equipo')).toEqual({});
  });

  it('marca todos los campos obligatorios vacíos', () => {
    const errors = validateRegistration(EMPTY_FORM, 'equipo');
    expect(errors.name).toBeDefined();
    expect(errors.email).toBeDefined();
    expect(errors.organization).toBeDefined();
  });

  it('no acepta un nombre de una sola letra', () => {
    expect(validateRegistration({ ...valid, name: 'E' }, 'equipo').name).toBeDefined();
  });

  it('no acepta espacios como nombre', () => {
    expect(validateRegistration({ ...valid, name: '   ' }, 'equipo').name).toBeDefined();
  });

  it('rechaza un mail sin arroba', () => {
    expect(validateRegistration({ ...valid, email: 'emi.liba.com' }, 'equipo').email).toBe(
      'Ese mail no parece válido.',
    );
  });

  it('rechaza un mail sin dominio', () => {
    expect(validateRegistration({ ...valid, email: 'emi@liba' }, 'equipo').email).toBeDefined();
  });

  it('acepta mails con subdominio y signo más', () => {
    expect(
      validateRegistration({ ...valid, email: 'emi+liba@mail.co.uk' }, 'equipo').email,
    ).toBeUndefined();
  });

  it('distingue el mensaje según el tipo de inscripción', () => {
    const equipo = validateRegistration({ ...valid, organization: '' }, 'equipo');
    const sponsor = validateRegistration({ ...valid, organization: '' }, 'sponsor');

    expect(equipo.organization).toBe('Poné el nombre del equipo.');
    expect(sponsor.organization).toBe('Poné el nombre de la marca.');
  });

  it('limita el largo del mensaje', () => {
    const errors = validateRegistration({ ...valid, message: 'x'.repeat(501) }, 'equipo');
    expect(errors.message).toBe('Máximo 500 caracteres.');
  });

  it('no exige mensaje', () => {
    expect(validateRegistration({ ...valid, message: '' }, 'equipo')).toEqual({});
  });
});

describe('isValid', () => {
  it('es verdadero sin errores', () => {
    expect(isValid({})).toBe(true);
  });

  it('es falso con al menos un error', () => {
    expect(isValid({ email: 'Ese mail no parece válido.' })).toBe(false);
  });
});
