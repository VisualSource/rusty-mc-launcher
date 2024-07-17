import { HTML5Backend } from "react-dnd-html5-backend";
import { DndProvider } from "react-dnd";

import { EditContainer } from "./edit/EditContainer";

function EditContainerLazy({
	setEditMode,
}: { setEditMode: React.Dispatch<React.SetStateAction<boolean>> }) {
	return (
		<DndProvider debugMode={import.meta.env.DEV} backend={HTML5Backend}>
			<EditContainer setEditMode={setEditMode} />
		</DndProvider>
	);
}

export default EditContainerLazy;
