import { type TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import { type AppDispatch, type ApplicationState } from './store/store';

export const useAppSelector: TypedUseSelectorHook<ApplicationState> = useSelector;
export const useAppDispatch = (): AppDispatch => useDispatch<AppDispatch>();
