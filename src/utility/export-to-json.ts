import { saveAs } from 'file-saver';

import { generateFileName } from './generate-file-name';

export const exportAsJson = (preface: string, data: string): void => {
  saveAs(
    new Blob([data], { type: 'appliation/json;charset=utf-8' }),
    generateFileName(preface, 'json')
  );
};
