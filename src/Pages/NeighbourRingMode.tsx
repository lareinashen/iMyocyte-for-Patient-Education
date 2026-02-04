import Checkbox from '@mui/material/Checkbox';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import { available_members, neighbourInterface} from '../data/GlobalVariables';
import Box from '@mui/material/Box';
import * as React from 'react';
import { Alert } from '@mui/material';

interface NeighbourProps {
  currentNeighbours: neighbourInterface[];
  cellsInRing: neighbourInterface[];
  setRingCells: React.Dispatch<React.SetStateAction<neighbourInterface[]>>;
}

const AddNeighbourRing = ({currentNeighbours, cellsInRing, setRingCells}: NeighbourProps) => {
    
  const icon = <CheckBoxOutlineBlankIcon fontSize="small" />;
  const checkedIcon = <CheckBoxIcon fontSize="small" />;
  let [selectedNeighbours, setSelectedNeighbours] = React.useState <neighbourInterface[]> ([]);

  selectedNeighbours = currentNeighbours
  function changeValueHandler(event:React.SyntheticEvent<Element, Event>, value: neighbourInterface[]) {
      event.isTrusted = event.isTrusted
      if (value.find(option => option.all)){
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

    setSelectedNeighbours(value)
    
    setRingCells(value)
  }

  function getRenderContent()
  {
        return (
        <Autocomplete
        multiple
        value={cellsInRing}
        limitTags={6}
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
      <Alert style={{ maxWidth: 375 }} severity="info">Please select at least 5 more cells before continuing...</Alert>
      <div className='pt-2'></div>
      {getRenderContent()}
    
    </Box>
  );
}

export default AddNeighbourRing



