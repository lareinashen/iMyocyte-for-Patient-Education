/**
 * ChooseMode Component
 *
 * This component allows users to select the simulation mode for myocyte signal propagation.
 * It presents three options as radio buttons:
 *
 * 1. Neighbour Mode - Manually select neighbouring cells for signal propagation
 * 2. Neighbour Ring Mode - Create a circular ring of cells for reentrant arrhythmia simulation
 * 3. Location Mode - Position cells based on physical location in a room
 *
 * This is Step 1 in the simulation setup process.
 */

import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Radio from '@mui/material/Radio';
import { SimulationMode } from '../data/Enums';

/**
 * ChooseMode Component Props
 * @param onData - Callback function to notify parent of selected mode
 * @param currentMode - Currently selected mode (for controlled component)
 */
function ChooseMode (props: { onData: (arg0: SimulationMode) => void; currentMode: unknown; }) {

    /**
     * handleSelect - Called when user selects a simulation mode
     * Notifies parent component of the selection via onData callback
     *
     * @param mode - The selected simulation mode
     */
    const handleSelect = (mode:SimulationMode) => {
        props.onData(mode)
      };

    /**
     * SimulationModes - Array of available simulation modes
     * Each mode has a display label and corresponding enum value
     */
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
        {/* Radio button group for mode selection */}
        <RadioGroup
            aria-labelledby="demo-radio-buttons-group-label"
            value={props.currentMode ?? ""}
            defaultValue={props.currentMode}
            name="radio-buttons-group">
                {
                    // Map through available modes and create radio buttons
                    SimulationModes.map( (item) => (
                        <FormControlLabel
                            key={item.mode}
                            value={item.label}
                            control={<Radio />}
                            label={item.label}
                            onChange={() => handleSelect(item.mode)}
                        />
                    ))
                }
        </RadioGroup>
        </div>
    );
}

export default ChooseMode