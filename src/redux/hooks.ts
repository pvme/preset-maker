import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";
import { AppDispatch, ApplicationState } from "./store/store";

export const useAppSelector: TypedUseSelectorHook<ApplicationState> = useSelector;
export const useAppDispatch = () => useDispatch<AppDispatch>();
