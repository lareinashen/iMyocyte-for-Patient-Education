/**
 * AddNeighbourRing Component (Neighbour Ring Mode Setup)
 *
 * This component allows users to select cells to form a circular ring topology.
 * The ring is used to simulate reentrant arrhythmias (abnormal heart rhythms where
 * signals continuously circulate through the ring).
 *
 * Requirements:
 * - Minimum 5 cells required to form a ring (including this cell)
 * - Cells are automatically connected in a circular pattern
 * - Each cell connects to its left and right neighbours in the ring
 *
 * This is Step 2 in the simulation setup for Neighbour Ring Mode.
 */

import Checkbox from '@mui/material/Checkbox';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import { available_members, neighbourInterface} from '../data/GlobalVariables';
import Box from '@mui/material/Box';
import * as React from 'react';
import { Alert } from '@mui/material';

/**
 * NeighbourProps - Component props interface
 * @property currentNeighbours - Currently selected neighbours (not used in ring mode)
 * @property cellsInRing - Currently selected cells for the ring
 * @property setRingCells - Function to update the cells in the ring
 */
interface NeighbourProps {
  currentNeighbours: neighbourInterface[];
  cellsInRing: neighbourInterface[];
  setRingCells: React.Dispatch<React.SetStateAction<neighbourInterface[]>>;
}

/**
 * AddNeighbourRing Component
 * Renders a multi-select autocomplete for choosing cells to form a ring
 */
const AddNeighbourRing = ({currentNeighbours, cellsInRing, setRingCells}: NeighbourProps) => {

  // Icons for checkbox states
  const icon = <CheckBoxOutlineBlankIcon fontSize="small" />;
  const checkedIcon = <CheckBoxIcon fontSize="small" />;

  // Local state for selected cells (synced with parent)
  let [selectedNeighbours, setSelectedNeighbours] = React.useState <neighbourInterface[]> ([]);

  // Keep local state in sync with parent
  selectedNeighbours = currentNeighbours

  /**
   * changeValueHandler - Handles changes to the ring cell selection
   *
   * Special handling for "Select All" option:
   * - If all cells are selected, clicking "Select All" deselects all
   * - If not all cells are selected, clicking "Select All" selects all
   *
   * @param event - The change event
   * @param value - The new array of selected cells
   */
  function changeValueHandler(event:React.SyntheticEvent<Element, Event>, value: neighbourInterface[]) {
      event.isTrusted = event.isTrusted

      // Check if "Select All" option was clicked
      if (value.find(option => option.all)){
        // Toggle: if all selected, deselect all; otherwise select all
        if(selectedNeighbours.length === available_members.length)
        {
          setRingCells([])
          setSelectedNeighbours([])
        }
        else
        {
          setRingCells(available_members)
          setSelectedNeighbours(available_members)
        }
        return
      }

    // Normal selection: update both local and parent state
    setSelectedNeighbours(value)
    setRingCells(value)
  }

  /**
   * getRenderContent - Renders the autocomplete component for ring cell selection
   *
   * @returns The Autocomplete component with checkboxes
   */
  function getRenderContent()
  {
        return (
        <Autocomplete
        multiple
        value={cellsInRing}
        limitTags={6}  // Show max 6 tags, then "+N more"
        onChange={(event, value) => changeValueHandler(event, value)}
        options={available_members}  // All available cells
        disableCloseOnSelect  // Keep dropdown open after selection
        isOptionEqualToValue={(option, value) => option.uid === value.uid}
        getOptionLabel={(option) => option.uid}

        renderOption={(props, option, { selected }) => {
            const { key, ...optionProps } = props;
            return (
              <li key={key} {...optionProps}>
                <Checkbox
                  icon={icon}
                  checkedIcon={checkedIcon}
                  style={{ marginRight: 8 }}
                  checked={selected}
                />
                {option.uid}
              </li>
            );
          }}
        style={{ maxWidth: 375 }}
        renderInput={(params) => (
            <TextField {...params} label="Cells in Ring" placeholder="" />
        )}
        />);
  }

  return (
    <Box>
      {/* Alert informing user of minimum cell requirement */}
      <Alert style={{ maxWidth: 375 }} severity="info">
        Please select at least 5 more cells before continuing...
      </Alert>
      <div className='pt-2'></div>
      {getRenderContent()}

    </Box>
  );
}

export default AddNeighbourRing



