import TopBar from "./components/TopBar";
import Sidebar from "./components/Sidebar";
import FloorPlan from "./components/FloorPlan";

function App() {
  return (
    <div className="grid h-full grid-cols-[18rem_1fr] grid-rows-[auto_1fr]">
      <Sidebar />
      <TopBar />
      <FloorPlan />
    </div>
  );
}

export default App;
