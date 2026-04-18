/**
 * AddNeighbour Component (Neighbour Mode Setup)
 *
 * This component allows users to select which other cells will be their neighbours
 * in Neighbour Mode. Signals will propagate from this cell to all selected neighbours.
 *
 * Features:
 * - Multi-select autocomplete with checkboxes
 * - "Select All" option to quickly select all available cells
 * - Shows up to 3 selected neighbours as tags, with "+N" for additional selections
 *
 * This is Step 2 in the simulation setup for Neighbour Mode.
 */

import Checkbox from '@mui/material/Checkbox';
import TextField from '@mui/material/TextField';
import Autocomplete, { createFilterOptions } from '@mui/material/Autocomplete';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import { available_members, neighbourInterface } from '../data/GlobalVariables';
import Box from '@mui/material/Box';
import * as React from 'react';
import { FilterOptionsState } from '@mui/material';

/**
 * NeighbourProps - Component props interface
 * @property currentNeighbours - Currently selected neighbour cells
 * @property setMyNeighbours - Function to update the selected neighbours
 */
interface NeighbourProps {
  currentNeighbours: neighbourInterface[];
  setMyNeighbours: React.Dispatch<React.SetStateAction<neighbourInterface[]>>;
}

/**
 * AddNeighbour Component
 * Renders a multi-select autocomplete for choosing neighbour cells
 */
const AddNeighbour = ({currentNeighbours, setMyNeighbours}: NeighbourProps) => {
  // Icons for checkbox states
  const icon = <CheckBoxOutlineBlankIcon fontSize="small" />;
  const checkedIcon = <CheckBoxIcon fontSize="small" />;

  // Local state for selected neighbours (synced with parent)
  let [selectedNeighbours, setSelectedNeighbours] = React.useState <neighbourInterface[]> ([]);

  // Keep local state in sync with parent
  selectedNeighbours = currentNeighbours

  /**
   * changeValueHandler - Handles changes to the neighbour selection
   *
   * Special handling for "Select All" option:
   * - If "Select All" is clicked and all are selected, deselect all
   * - If "Select All" is clicked and not all are selected, select all
   *
   * @param event - The change event
   * @param value - The new array of selected neighbours
   */
  function changeValueHandler(event:React.SyntheticEvent<Element, Event>, value: neighbourInterface[]) {
    event.isTrusted = event.isTrusted

    // Check if "Select All" option was clicked
    if (value.find(option => option.all)){
      // Toggle: if all selected, deselect all; otherwise select all
      if(selectedNeighbours.length === available_members.length)
      {
        setMyNeighbours([])
        setSelectedNeighbours([])
      }
      else
      {
        setMyNeighbours(available_members)
        setSelectedNeighbours(available_members)
      }
      return
    }

    // Normal selection: update both local and parent state
    setSelectedNeighbours(value)
    setMyNeighbours(value)
  }

  /**
   * filterOptions - Custom filter function to add "Select All" option
   *
   * Adds a special "Select All..." option at the top of the dropdown list
   *
   * @param options - Available neighbour options
   * @param params - Filter parameters from Autocomplete
   * @returns Filtered options with "Select All" prepended
   */
  const filterOptions = (options: neighbourInterface[], params: FilterOptionsState<neighbourInterface>) => {
    const filter = createFilterOptions()
    const filtered = filter(options, params as FilterOptionsState<unknown>) as neighbourInterface[]
    // Add "Select All" option at the beginning
    return [{ uid: 'Select All...', all: true }, ...filtered]
  };

  return (
    <Box>
    {/* Multi-select autocomplete for neighbour selection */}
    <Autocomplete
      multiple
      value={currentNeighbours}
      limitTags={3}  // Show max 3 tags, then "+N more"
      filterOptions={filterOptions}
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
                        // For "Select All", check if all members are selected
                        // For regular options, use the selected state
                        checked={option.all ? !!(selectedNeighbours.length === available_members.length) : selected}
                    />
                  {option.uid}
                </li>
              );
            }}
      style={{ maxWidth: 375 }}
      renderInput={(params) => (
        <TextField {...params} label="Neighbours" placeholder="" />
      )}
    />
    </Box>
  );
}

export default AddNeighbour



