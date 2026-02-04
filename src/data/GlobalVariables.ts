import { ActionType } from "./Enums";

export interface neighbourInterface{
  uid: string,
  all : boolean
}

export interface notificationTrackingInterface{
  uuid: number
}

export interface messagePostInterface {
  uuid: number,
  cellId: string,
  initialCellId: string,
  fromCellId: string,
  toCellId:string,
  circlingCellIds:string,
  fireTime: number
  isHealthyRun: boolean,
  isBlocked: boolean,
  inReentryMode: boolean,
  cv_ms: number,
  rp_ms: number,
  modeName: string,
  levelName: string,
  isSleeping: boolean
}

export interface cellStateInterface
{
  cellId:string;
  ringMasterCellId: string;
  isBlocked: boolean;
  blockedUuid: number;
  isMaster: boolean;
  inRing: boolean;
  inRefractoryPeriod: boolean;
}

export interface messageInterface {
  uuid: number,
  initialCellId: string,
  fromCellId: string,
  toCellIds:neighbourInterface[],
  circlingCellIds:neighbourInterface[],
  action: ActionType,
  fireTime: number
  selectedActivity:activityInterface | null,
  isHealthyRun: boolean,
  blockedCellId: string,
  inReentryMode: boolean,
  healthy_cv: number,
  unhealthy_cv: number,
  healthy_rp: number,
  unhealthy_rp: number,
  modeName: string,
  levelName: string,
}

export interface SiblingChangedInterface{
  changed: boolean,
  message : null |messageInterface
}

export interface RunningInfoInterface{
  modeName: string,
  levelName: string,
  cvValue: number,
  rpValue: number,
  inReentry: boolean
}

export interface activityInterface{
  displayName: string,
  rp_healthy_value:number,
  rp_unhealthy_value:number
  cv_healthy_value:number,
  cv_unhealthy_value:number
}

export interface RefractoryPeriodStatusInterface
{
  inRefractoryPeriod: boolean
}

export var circlingCells:neighbourInterface[] = [];

export const neighbours:neighbourInterface[] = [];

export const available_members:neighbourInterface[] = [];

export const notificationTrackingItems: notificationTrackingInterface[] = []

export const changesTrackingItems: notificationTrackingInterface[] = []

export const diagostic_list=[""];

export let cellID = uid();

export let refractoryPeriodStatus : RefractoryPeriodStatusInterface = {inRefractoryPeriod : false}

export const cellInfo:cellStateInterface = {
  cellId: cellID, isBlocked: false, isMaster: true, inRing: false, ringMasterCellId: "",
  blockedUuid: 0,
  inRefractoryPeriod: false
}

function uid() {
    var result           = '';
    var characters       = 'abcdefghijklmnpqrstuvxyz';
    var charactersLength = characters.length;
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
    result += (Math.floor(Math.random() * 10).toString());
    result += (Math.floor(Math.random() * 10).toString());

    circlingCells = []
    return result;
  }