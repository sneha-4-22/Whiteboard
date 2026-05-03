import Board from "./components/Board";
import Toolbar from "./components/Toolbar";
import Toolbox from "./components/Toolbox";
import StickyLayer from "./components/StickyLayer";
import BoardProvider from "./store/BoardProvider";
import ToolboxProvider from "./store/ToolboxProvider";

function App() {
  return (
    <BoardProvider>
      <ToolboxProvider>
        <Toolbar />
        <Board />
        <StickyLayer />
        <Toolbox />
      </ToolboxProvider>
    </BoardProvider>
  );
}

export default App;