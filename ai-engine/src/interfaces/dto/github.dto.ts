import { IsNotEmpty, IsOptional, IsString, IsObject } from 'class-validator';

export class ListFilesQueryDto {
  @IsString() @IsNotEmpty() owner!: string;
  @IsString() @IsNotEmpty() repo!: string;
  @IsString() @IsOptional() path?: string;   // default '/'
  @IsString() @IsOptional() ref?: string;    
}

export class GetContentQueryDto {
  @IsString() @IsNotEmpty() owner!: string;
  @IsString() @IsNotEmpty() repo!: string;
  @IsString() @IsNotEmpty() path!: string;   
  @IsString() @IsOptional() ref?: string;
}

export class ListTreeQueryDto {
  @IsString() @IsNotEmpty() owner!: string;
  @IsString() @IsNotEmpty() repo!: string;
  @IsString() @IsOptional() ref?: string;   
}

export class UpsertFileDto {
  @IsString() @IsNotEmpty() owner!: string;
  @IsString() @IsNotEmpty() repo!: string;
  @IsString() @IsNotEmpty() path!: string;
  @IsString() @IsNotEmpty() content!: string; 
  @IsString() @IsNotEmpty() message!: string;
  @IsString() @IsOptional() branch?: string;
  @IsString() @IsOptional() expectedSha?: string;

  @IsObject() @IsOptional()
  author?: { name: string; email: string };

  @IsObject() @IsOptional()
  committer?: { name: string; email: string };
}

export class DeleteFileDto {
  @IsString() @IsNotEmpty() owner!: string;
  @IsString() @IsNotEmpty() repo!: string;
  @IsString() @IsNotEmpty() path!: string;
  @IsString() @IsOptional() message?: string;
  @IsString() @IsOptional() branch?: string;
}
