export enum SimulationMode {
    None = "",
    Neighbour = "Neighbour",
    Location = "Location",
    NeighbourRing = "Neighbour NeighbourRing",
  }

export enum ActionType {
    None = 0,
    AddNeighbour,
    BuildCircling,
    RemoveFromCircling,
    AddMember,
    DeleteNeighbour,
    DeleteMember, // when user leaves or refreshes page
    FireNotification,
    SettingsChanged // when RP, CV, healthy and unhealthy cell settings are changes
  }