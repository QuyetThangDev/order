import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  Input,
  Form,
  Button,
  PasswordInput
  // ScrollArea
} from '@/components/ui'
import { registerSchema } from '@/schemas'
import { zodResolver } from '@hookform/resolvers/zod'
import { ButtonLoading } from '@/components/app/loading'
import React from 'react'
// import { useThemeStore } from '@/stores'

interface IFormRegisterProps {
  onSubmit: (data: z.infer<typeof registerSchema>) => void
  isLoading: boolean
}

export const RegisterForm: React.FC<IFormRegisterProps> = ({ onSubmit, isLoading }) => {
  const { t } = useTranslation(['auth'])
  //   const { getTheme } = useThemeStore()
  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      phonenumber: '',
      password: '',
      confirmPassword: '',
      firstName: '',
      lastName: ''
    }
  })

  const handleSubmit = (values: z.infer<typeof registerSchema>) => {
    onSubmit(values)
  }

  const formFields = {
    phonenumber: (
      <FormField
        control={form.control}
        name="phonenumber"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('login.phoneNumber')}</FormLabel>
            <FormControl>
              <Input placeholder={t('login.enterPhoneNumber')} {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    ),
    password: (
      <FormField
        control={form.control}
        name="password"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('login.password')}</FormLabel>
            <FormControl>
              <PasswordInput placeholder={t('login.enterPassword')} {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    ),
    confirmPassword: (
      <FormField
        control={form.control}
        name="confirmPassword"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('login.confirmPassword')}</FormLabel>
            <FormControl>
              <PasswordInput placeholder={t('login.enterPassword')} {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    ),
    firstName: (
      <FormField
        control={form.control}
        name="firstName"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('login.firstName')}</FormLabel>
            <FormControl>
              <Input placeholder={t('login.enterFirstName')} {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    ),
    lastName: (
      <FormField
        control={form.control}
        name="lastName"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('login.lastName')}</FormLabel>
            <FormControl>
              <Input placeholder={t('login.enterLastName')} {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    )
  }

  return (
    <div className="mt-3">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <div className="grid grid-cols-2 md:w-[36rem] text-white gap-2">
            {/* <ScrollArea className="max-h-[16rem] gap-2 flex flex-1"> */}
            {Object.keys(formFields).map((key) => (
              <React.Fragment key={key}>
                {formFields[key as keyof typeof formFields]}
              </React.Fragment>
            ))}
            {/* </ScrollArea> */}
          </div>
          <div className="flex items-center justify-between w-full">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? <ButtonLoading /> : t('register.title')}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}