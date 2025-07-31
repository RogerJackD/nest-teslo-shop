import { v4 as uuid } from 'uuid'

export const fileNamer = (req: Express.Request, file: Express.Multer.File, callbak: Function ) => {
    //console.log({file})
    if( !file ) return callbak( new Error('file is empty'), false)
    
    const fileExptension = file.mimetype.split('/')[1];

    const fileName = `${ uuid() }.${ fileExptension }`;

    callbak(null, fileName);
}