
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Radio from '@mui/material/Radio';
import { SimulationMode } from '../data/Enums';

// return comment
function ChooseMode (props: { onData: (arg0: SimulationMode) => void; currentMode: unknown; }) {
    //const [mode, setMode] = React.useState(SimulationMode.None);
    
    const handleSelect = (mode:SimulationMode) => {
        //setMode(mode);
        props.onData(mode)
        //selectedMode = mode;
      };
    
    const SimulationModes = [
        {
            label: "Neighbour Mode",
            mode: SimulationMode.Neighbour
        },
        {
            label: "Neighbour Ring Mode",
            mode: SimulationMode.NeighbourRing
        },
        {
            label: "Location Mode",
            mode: SimulationMode.Location
        }
    ];
    return (
        <div>
        <RadioGroup
            aria-labelledby="demo-radio-buttons-group-label"
            value={props.currentMode ?? ""} 
            defaultValue={props.currentMode}
            name="radio-buttons-group">
                {
                    SimulationModes.map( (item) => (
                        <FormControlLabel key={item.mode} value={item.label} control={<Radio />} label={item.label} onChange={() => handleSelect( item.mode)} /> )
                    )
                }
        </RadioGroup>
        </div>
    );
}

export default ChooseMode