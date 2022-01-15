// import { PlexusInstance, PxStateType } from '../interfaces';

import { PlexusInstance } from "../instance";

export interface PxCollectionInstance<DataType=any> {
	collect(data: DataType): void;
}


export function collection<DataType extends any>(instance: () => PlexusInstance): PxCollectionInstance<DataType> {
  const collect = (data: DataType) => {

  }
  return {
    collect
  };
}