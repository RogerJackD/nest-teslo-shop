
export const fileFilter = (req: Express.Request, file: Express.Multer.File, callbak: Function ) => {
    //console.log({file})
    if( !file ) return callbak( new Error('file is empty'), false)
    
    const fileExptension = file.mimetype.split('/')[1];
    const validExtensions = ['jpg','jpeg','png','gif'];

    if( validExtensions.includes( fileExptension) ){
        return callbak( null, true );
    }

    callbak(null, true);
}