import Button from '@mui/material/Button';
import React from 'react';
import { signIn } from '../../../auth/session';

export const SignInButton = (): JSX.Element => {
  return (
    <Button color="primary" variant="contained" onClick={signIn} className="mr-8">
      Sign in
    </Button>
  );
};
