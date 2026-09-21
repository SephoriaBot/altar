import { createContext, useContext } from 'react';
import { DEFAULT_TRADITION, TRADITIONS, type Tradition } from '../data/traditions';

const Ctx = createContext<Tradition>(TRADITIONS[DEFAULT_TRADITION]);

export const TraditionProvider = Ctx.Provider;
export const useTradition = () => useContext(Ctx);
