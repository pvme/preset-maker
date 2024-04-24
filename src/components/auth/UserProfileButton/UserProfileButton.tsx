
import React from 'react';
import { useAppSelector } from '../../../redux/hooks';
import { selectAuth } from '../../../redux/store/reducers/auth-reducer';
import { SignInButton } from '../SignInButton/SIgnInButton';
import Menu from '@mui/material/Menu';
import { Avatar, CircularProgress, MenuItem } from '@mui/material';
import { signOut } from '../../../auth/session';
import { FetchState } from '../../../types/util';

export const UserProfileButton = (): JSX.Element => {
  const authState = useAppSelector(selectAuth);
  const isLoading = authState.fetchState === FetchState.Pending;
  const isSignedIn = authState.session !== undefined;

  // Popover menu
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const onAvatarClick = (event: React.MouseEvent<HTMLDivElement>): void => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = (): void => {
    setAnchorEl(null);
  };

  const handleSignOut = (): void => {
    signOut();
  };

  if (isLoading) {
    return (
      <div className="height-100 d-flex flex-center">
        <CircularProgress />
      </div>
    );
  }

  return (
    (isSignedIn
      ? <>
        <Avatar
          src={authState.session?.user?.image ?? undefined}
          onClick={onAvatarClick}
          style={{
            cursor: 'pointer'
          }}
        />
        <Menu
          id="user-profile-menu"
          anchorEl={anchorEl}
          open={open}
          onClose={handleClose}
          MenuListProps={{
            'aria-labelledby': 'basic-button'
          }}
          style={{
            marginTop: '8px'
          }}
        >
          <MenuItem onClick={handleSignOut} sx={{
            backgroundColor: 'initial !important',
            color: 'rgba(255, 255, 255, 0.8)',
            '&:hover': {
              backgroundColor: 'initial',
              color: 'white'
            }
          }}>Sign out</MenuItem>
        </Menu>
      </>
      : <SignInButton />
    )
  );
};
