'use client';

import React, {
  createContext, useContext, useReducer, ReactNode, useEffect
} from 'react';

type Action = { type: 'SET_ACTIVE_PROJECT'; payload: boolean };

const ActiveProjectContext = createContext<boolean | undefined>(undefined);
const ActiveProjectDispatchContext = createContext<React.Dispatch<Action> | undefined>(undefined);

const initialState: boolean = false;

const activeProjectReducer = (state: boolean, action: Action): boolean => {
  switch (action.type) {
    case 'SET_ACTIVE_PROJECT':
      return action.payload;
    default:
      return state;
  }
};

const ActiveProjectProvider = ({ children }: { children: ReactNode }) => {
  let initialActiveProject = initialState;
  if (typeof window !== 'undefined' && window.localStorage) {
    const activeProject = localStorage.getItem('activeProject');
    initialActiveProject = activeProject ? JSON.parse(activeProject) : initialState;
  }
  const [initialActiveProjectProv, dispatchDataProv] = useReducer(activeProjectReducer, initialActiveProject);
  useEffect(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('activeProject', JSON.stringify(initialActiveProjectProv));
    }
  }, [initialActiveProjectProv]);

  return (
        <ActiveProjectContext.Provider value={initialActiveProjectProv}>
            <ActiveProjectDispatchContext.Provider value={dispatchDataProv}>
                {children}
            </ActiveProjectDispatchContext.Provider>
        </ActiveProjectContext.Provider>
  );
};

const useActiveProject = () => {
  const context = useContext(ActiveProjectContext);
  if (context === undefined) {
    throw new Error('useActiveProject must be used within an ActiveProjectProvider');
  }
  return context;
};

const useActiveProjectDispatch = () => {
  const context = useContext(ActiveProjectDispatchContext);
  if (context === undefined) {
    throw new Error('useActiveProjectDispatch must be used within an ActiveProjectProvider');
  }
  return context;
};

export { ActiveProjectProvider, useActiveProject, useActiveProjectDispatch };
