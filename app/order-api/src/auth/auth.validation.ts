import { createErrorCode, TErrorCodeValue } from 'src/app/app.validation';

export const INVALID_PHONENUMBER = 'INVALID_PHONENUMBER';
export const INVALID_USERID = 'INVALID_USERID';
export const INVALID_PASSWORD = 'INVALID_PASSWORD';
export const INVALID_FIRSTNAME = 'INVALID_FIRSTNAME';
export const INVALID_LASTNAME = 'INVALID_LASTNAME';
export const USER_EXISTS = 'USER_EXISTS';
export const USER_NOT_FOUND = 'USER_NOT_FOUND';
export const INVALID_OLD_PASSWORD = 'INVALID_OLD_PASSWORD';
export const FORGOT_TOKEN_EXPIRED = 'FORGOT_TOKEN_EXPIRED';
export const FORGOT_TOKEN_EXISTS = 'FORGOT_TOKEN_EXISTS';
export const INVALID_CREDENTIALS = 'INVALID_CREDENTIALS';
export const ERROR_UPDATE_USER = 'ERROR_UPDATE_USER';
export const INVALID_EMAIL = 'INVALID_EMAIL';
export const INVALID_ADDRESS = 'INVALID_ADDRESS';
export const INVALID_DOB = 'INVALID_DOB';

export type TAuthErrorCodeKey =
  | typeof INVALID_PHONENUMBER
  | typeof INVALID_PASSWORD
  | typeof INVALID_LASTNAME
  | typeof INVALID_USERID
  | typeof USER_EXISTS
  | typeof USER_NOT_FOUND
  | typeof INVALID_OLD_PASSWORD
  | typeof FORGOT_TOKEN_EXPIRED
  | typeof INVALID_CREDENTIALS
  | typeof FORGOT_TOKEN_EXISTS
  | typeof ERROR_UPDATE_USER
  | typeof INVALID_EMAIL
  | typeof INVALID_ADDRESS
  | typeof INVALID_DOB
  | typeof INVALID_FIRSTNAME;

export type TAuthErrorCode = Record<TAuthErrorCodeKey, TErrorCodeValue>;

// 119000 - 120000
export const AuthValidation: TAuthErrorCode = {
  INVALID_PHONENUMBER: createErrorCode(119000, 'Phone number is required'),
  INVALID_PASSWORD: createErrorCode(119001, 'Password is required'),
  INVALID_FIRSTNAME: createErrorCode(119002, 'First name is required'),
  INVALID_LASTNAME: createErrorCode(119003, 'Last name is required'),
  INVALID_USERID: createErrorCode(119004, 'User ID is required'),
  USER_EXISTS: createErrorCode(119005, 'User exist'),
  USER_NOT_FOUND: createErrorCode(119006, 'User not found'),
  INVALID_OLD_PASSWORD: createErrorCode(119007, 'Invalid old password'),
  FORGOT_TOKEN_EXPIRED: createErrorCode(119008, 'Forgot token is expired'),
  FORGOT_TOKEN_EXISTS: createErrorCode(119009, 'Forgot token exists'),
  INVALID_CREDENTIALS: createErrorCode(119010, 'Invalid credentials'),
  ERROR_UPDATE_USER: createErrorCode(119011, 'Error when updating user'),
  INVALID_EMAIL: createErrorCode(119012, 'Invalid email'),
  INVALID_ADDRESS: createErrorCode(119013, 'Invalid address'),
  INVALID_DOB: createErrorCode(119014, 'Invalid date of birth'),
};
