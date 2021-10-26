import terminal from 'terminal-kit';
const {terminal: term} = terminal;


function question() {
  term( 'Do you like javascript? [Y|n]\n' ) ;
  return new Promise(resolve =>{
    term.yesOrNo( { yes: [ 'y' , 'ENTER' ] , no: [ 'n' ] } , function h( error , result ) {
      if ( result ) {
        term.green( "'Yes' detected! Good bye!\n" ) ;
        resolve(result)
        term.grabInput( false )
      }else {
        term.red( "'No' detected, are you sure?\n" ) ;
      }
    });
  })
}

await question() ;
console.log('I am Out')
