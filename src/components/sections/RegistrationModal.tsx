'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Field, TextArea } from '@/components/ui/Field';
import { Modal } from '@/components/ui/Modal';
import { SITE } from '@/lib/site';
import type { FormErrors, RegistrationForm, RegistrationKind } from '@/lib/validation';
import { EMPTY_FORM, isValid, validateRegistration } from '@/lib/validation';

const COPY: Record<RegistrationKind, { title: string; intro: string; organization: string }> = {
  equipo: {
    title: 'Inscribí tu equipo',
    intro:
      'Dejanos tus datos y te escribimos con el instructivo de pago y la fecha de acreditación.',
    organization: 'Nombre del equipo',
  },
  sponsor: {
    title: 'Quiero ser sponsor',
    intro: 'Contanos de tu marca y te pasamos el detalle de cada plan con sus valores.',
    organization: 'Nombre de la marca',
  },
};

type RegistrationModalProps = {
  open: boolean;
  kind: RegistrationKind;
  /** Plan preseleccionado, cuando se abre desde una tarjeta de sponsors. */
  tier?: string;
  onClose: () => void;
};

/**
 * Formulario de inscripción de equipos y de sponsors.
 *
 * No hay backend: la validación es en el cliente y el envío termina en una
 * pantalla de confirmación que remite al mail de la liga. Se dice explícitamente
 * en la confirmación para no dar a entender que el mensaje se envió a algún lado.
 *
 * El estado del formulario se limpia remontando el componente con una `key`
 * distinta en cada apertura, que es la forma que recomienda React para resetear
 * estado: hacerlo con un efecto provoca un render extra con los datos viejos.
 */
export function RegistrationModal({ open, kind, tier, onClose }: RegistrationModalProps) {
  const [form, setForm] = useState<RegistrationForm>(EMPTY_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [sent, setSent] = useState(false);

  const copy = COPY[kind];

  const update = (key: keyof RegistrationForm) => (value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
    // El error del campo se limpia al corregirlo, sin esperar al próximo envío.
    setErrors((current) => {
      if (!current[key]) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const found = validateRegistration(form, kind);
    setErrors(found);
    if (isValid(found)) setSent(true);
  };

  return (
    <Modal open={open} onClose={onClose} title={copy.title}>
      {sent ? (
        <div className="flex flex-col items-start gap-4">
          <p className="text-soft text-lg">
            Listo, {form.name.trim()}. Anotamos a{' '}
            <strong className="text-orange">{form.organization.trim()}</strong>.
          </p>
          <p className="text-muted text-sm leading-relaxed">
            Esta landing todavía no tiene servidor, así que el formulario no envía nada por su
            cuenta. Escribinos a{' '}
            <a
              href={`mailto:${SITE.email}`}
              className="text-orange font-semibold underline underline-offset-2"
            >
              {SITE.email}
            </a>{' '}
            y te contestamos con el instructivo.
          </p>
          <Button onClick={onClose} className="mt-2" data-autofocus>
            Cerrar
          </Button>
        </div>
      ) : (
        <form onSubmit={submit} noValidate className="flex flex-col gap-4">
          <p className="text-muted text-[15px] leading-relaxed">{copy.intro}</p>
          {tier ? (
            <p className="text-dim text-sm">
              Plan elegido: <span className="text-orange font-semibold capitalize">{tier}</span>
            </p>
          ) : null}

          <Field
            data-autofocus
            label="Tu nombre"
            name="name"
            value={form.name}
            error={errors.name}
            onChange={(event) => update('name')(event.target.value)}
            autoComplete="name"
          />
          <Field
            label="Mail"
            name="email"
            type="email"
            value={form.email}
            error={errors.email}
            onChange={(event) => update('email')(event.target.value)}
            autoComplete="email"
          />
          <Field
            label={copy.organization}
            name="organization"
            value={form.organization}
            error={errors.organization}
            onChange={(event) => update('organization')(event.target.value)}
          />
          <TextArea
            label="Mensaje"
            name="message"
            value={form.message}
            error={errors.message}
            hint="Opcional, hasta 500 caracteres."
            onChange={(event) => update('message')(event.target.value)}
          />

          <div className="mt-1 flex gap-3">
            <Button type="submit" className="flex-1 justify-center">
              Enviar
            </Button>
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancelar
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
