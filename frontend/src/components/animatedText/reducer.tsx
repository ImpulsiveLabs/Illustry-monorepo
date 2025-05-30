type State = {
  speed: number
  text: string
  count: number
}

type Action =
  | { type: 'DELAY'; payload: number }
  | { type: 'TYPE'; payload: string; speed: number }
  | { type: 'DELETE'; payload: string; speed: number }
  | { type: 'COUNT' }

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'TYPE':
      return {
        ...state,
        speed: action.speed,
        text: action.payload?.substring(0, state.text.length + 1)
      };
    case 'DELAY':
      return {
        ...state,
        speed: action.payload
      };
    case 'DELETE':
      return {
        ...state,
        speed: action.speed,
        text: action.payload?.substring(0, state.text.length - 1)
      };
    case 'COUNT':
      return {
        ...state,
        count: state.count + 1
      };
    default:
      return state;
  }
};

export { reducer };

export type { State, Action };
