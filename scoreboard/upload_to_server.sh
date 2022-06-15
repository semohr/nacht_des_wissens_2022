# The following is called a HERE document
sftp -P 2222 smohr@vwebfile.gwdg.de << @ 
    cd www/info-theory/
    put -r .
    quit
@
