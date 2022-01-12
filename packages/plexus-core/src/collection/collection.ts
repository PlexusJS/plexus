import { PlexusInstance, PxCollectionInstance, PxStateType } from '../interfaces';

export function collection<DataType extends PxStateType>(instance: () => PlexusInstance): PxCollectionInstance<DataType> {
  const collect = (data: DataType) => {

  }
  return {
    collect
  };
}