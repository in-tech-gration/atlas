export default function exifTool(options){

  const filename = options[0];
  if ( !filename ){
    return console.log("ERROR:exiftool: you must provide a filename.");
  }

  try {
    console.log({ options });
  } catch (error) {
    console.log({ error });
  }

}