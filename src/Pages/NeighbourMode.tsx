import Checkbox from '@mui/material/Checkbox';
import TextField from '@mui/material/TextField';
import Autocomplete, { createFilterOptions } from '@mui/material/Autocomplete';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import { available_members, neighbourInterface } from '../data/GlobalVariables';
import Box from '@mui/material/Box';
import * as React from 'react';
import { FilterOptionsState } from '@mui/material';

interface NeighbourProps {
  currentNeighbours: neighbourInterface[];
  setMyNeighbours: React.Dispatch<React.SetStateAction<neighbourInterface[]>>;
}

const AddNeighbour = ({currentNeighbours, setMyNeighbours}: NeighbourProps) => {
  const icon = <CheckBoxOutlineBlankIcon fontSize="small" />;
  const checkedIcon = <CheckBoxIcon fontSize="small" />;
  let [selectedNeighbours, setSelectedNeighbours] = React.useState <neighbourInterface[]> ([]);

  selectedNeighbours = currentNeighbours
  function changeValueHandler(event:React.SyntheticEvent<Element, Event>, value: neighbourInterface[]) {
    event.isTrusted = event.isTrusted
      if (value.find(option => option.all)){
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

    setSelectedNeighbours(value)
    
    setMyNeighbours(value)
  }

  const filterOptions = (options: neighbourInterface[], params: FilterOptionsState<neighbourInterface>) => {
    // Custom filtering logic
    const filter = createFilterOptions()
    const filtered = filter(options, params as FilterOptionsState<unknown>) as neighbourInterface[]    
    return [{ uid: 'Select All...', all: true }, ...filtered]
  };

  return (
    <Box>
    <Autocomplete
      multiple
      value={currentNeighbours}
      limitTags={3}
      filterOptions={filterOptions}
      // onChange={(event, newValue) => { setValue(newValue); }} <<<--- OLD
      onChange={(event, value) => changeValueHandler(event, value)}
      options={available_members}
      disableCloseOnSelect
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
                        // checked={selected} <<<--- OLD
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



