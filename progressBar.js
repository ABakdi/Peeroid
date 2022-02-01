var progressBar , progress = 0 ;

import terminal from 'terminal-kit';
const {terminal: term} = terminal;

function doProgress()
{
	// Add random progress
	progress += Math.random() / 10 ;
	progressBar.update( progress ) ;

	if ( progress >= 1 )
	{
		// Cleanup and exit
		setTimeout( function() { term( '\n' ) ; process.exit() ; } , 200 ) ;
	}
	else
	{
		setTimeout( doProgress , 100 + Math.random() * 400 ) ;
	}
}


progressBar = term.progressBar( {
  x: 3*term.width/4,
  y: term.height/2,
  width: term.width/4 ,
  height: 1,
  title: 'Serious stuff in progress:' ,
  eta: true ,
  percent: true
} ) ;

doProgress() ;
