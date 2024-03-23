// reducer.ts
interface State {
    elemList: React.ReactNode[];
    frameId: number;
  }
  
  interface Action {
    type: string;
    payload?: number;
  }
  
  const initialState: State = {
    elemList: [],
    frameId: 0
  };
  
  const reducer = (state: State = initialState, action: Action): State => {
    switch (action.type) {
      case 'ADD_ELEMENT':
        return {
          ...state,
          elemList: [...state.elemList, action.payload]
        };
      case 'SET_FRAME_ID':
        return {
          ...state,
          frameId: (action.payload as number)
        };
      default:
        return state;
    }
  };
  
  export default reducer;
  