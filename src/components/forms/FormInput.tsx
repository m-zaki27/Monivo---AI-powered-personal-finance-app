import { Controller, type Control, type FieldValues, type Path } from 'react-hook-form';

import { Input, type InputProps } from '@/components/ui';

type FormInputProps<T extends FieldValues> = Omit<InputProps, 'value' | 'onChangeText' | 'onBlur' | 'error' | 'ref'> & {
  control: Control<T>;
  name: Path<T>;
};

/**
 * <Input> wired to React Hook Form. RHF keeps form state outside React state,
 * so typing in one field doesn't re-render the whole form. The `ref` lets
 * `form.setFocus('password')` jump between fields.
 */
export function FormInput<T extends FieldValues>({ control, name, ...rest }: FormInputProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Input
          ref={field.ref}
          value={field.value}
          onChangeText={field.onChange}
          onBlur={field.onBlur}
          error={fieldState.error?.message}
          {...rest}
        />
      )}
    />
  );
}
