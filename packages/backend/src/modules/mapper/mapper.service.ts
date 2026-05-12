import { AppError } from '../../shared/errors/error-handler';
import * as repo    from './mapper.repository';
import type { CreateMapperDto, UpdateMapperDto, MapperQueryDto } from './mapper.dto';

export async function getMappers(query: MapperQueryDto) {
  return repo.findAllMappers(query);
}

export async function getMapperById(id: number) {
  const mapper = await repo.findMapperById(id);
  if (!mapper) throw new AppError(404, `Mapper with id ${id} not found`);
  return mapper;
}

export async function createMapper(data: CreateMapperDto) {
  return repo.createMapper(data);
}

export async function updateMapper(id: number, data: UpdateMapperDto) {
  await getMapperById(id);
  return repo.updateMapper(id, data);
}

export async function deleteMapper(id: number) {
  await getMapperById(id);
  await repo.deleteMapper(id);
}
