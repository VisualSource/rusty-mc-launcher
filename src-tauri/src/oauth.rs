//! Tauri oauth plugin
//! https://github.com/FabianLars/tauri-plugin-oauth
//!
//! custom version of FabianLars oauth plugin.
//!
use std::{
    io::{Read, Write},
    net::{SocketAddr, TcpListener, TcpStream},
    thread,
};

use log::error;

use crate::errors::Error;

const EXIT: [u8; 4] = [1, 3, 3, 7];
const HTTP_RESPONSE: &str = "
<html>
    <head>
        <title>Auth</title>
        <script>
            fetch('http://localhost:{PORT}/cb',{
                headers:{
                    'X-Full-URL':window.location.href
                }
            }).catch(()=>window.close());
        </script>
        <style>
            @media(prefers-color-scheme: dark) {
                :root {
                    --bg-color: #121212;
                    --text-color: #eee;
                    --spinner: #fffff;
                }
            }
            :root {
                --bg-color: #ffffff;
                --text-color: #000000;
                --spinner: #000000;
            }

            html,body {
                height: 100vh;
                width: 100%;
                margin: 0;
                box-sizing: border-box;
                color: var(--text-color),
                background-color: var(--bg-color)
            }
            #root {
                height: 100%;
                width: 100%;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
            }

            .lds-ring {
                /* change color here */
                color: var(--spinner)
              }
              .lds-ring,
              .lds-ring div {
                box-sizing: border-box;
              }
              .lds-ring {
                display: inline-block;
                position: relative;
                width: 80px;
                height: 80px;
              }
              .lds-ring div {
                box-sizing: border-box;
                display: block;
                position: absolute;
                width: 64px;
                height: 64px;
                margin: 8px;
                border: 8px solid currentColor;
                border-radius: 50%;
                animation: lds-ring 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;
                border-color: currentColor transparent transparent transparent;
              }
              .lds-ring div:nth-child(1) {
                animation-delay: -0.45s;
              }
              .lds-ring div:nth-child(2) {
                animation-delay: -0.3s;
              }
              .lds-ring div:nth-child(3) {
                animation-delay: -0.15s;
              }
              @keyframes lds-ring {
                0% {
                  transform: rotate(0deg);
                }
                100% {
                  transform: rotate(360deg);
                }
              }
        </style>
    </head>
    <body>
        <div id='root'>
            <div class='lds-ring'>
                <div></div>
                <div></div>
                <div></div>
                <div></div>
            </div>
        </div>
    </body>
</html
";

enum RequestResult {
    Ok(String),
    Exit,
    None,
}

pub fn start<F: FnMut(String) + Send + 'static>(mut handler: F) -> Result<u16, Error> {
    let listener = TcpListener::bind(SocketAddr::from(([127, 0, 0, 1], 0)))?;

    let port = listener.local_addr()?.port();

    thread::spawn(move || {
        for conn in listener.incoming() {
            match conn {
                Ok(conn) => match handle_connection(conn, port) {
                    Ok(result) => match result {
                        RequestResult::Ok(url) => {
                            handler(url);
                            break;
                        }
                        RequestResult::Exit => break,
                        RequestResult::None => {}
                    },
                    Err(err) => {
                        error!("{}", err);
                        break;
                    }
                },
                Err(err) => error!("Error reading incoming connection: {}", err.to_string()),
            }
        }
    });

    Ok(port)
}
//error!("Error reading incoming connection: {}", err.to_string());
fn handle_connection(
    mut conn: TcpStream,
    port: u16,
) -> Result<RequestResult, crate::errors::Error> {
    let mut buffer = [0; 4048];
    let _ = conn.read(&mut buffer)?;

    if buffer[..4] == EXIT {
        return Ok(RequestResult::Exit);
    }

    let mut headers = [httparse::EMPTY_HEADER; 16];
    let mut request = httparse::Request::new(&mut headers);
    request
        .parse(&buffer)
        .map_err(|e| crate::errors::Error::Auth(e.to_string()))?;

    let path = request.path.unwrap_or_default();

    let (result, status, response) = match path {
        "/exit" => (RequestResult::Exit, "200 Ok", "Ok".to_string()),
        "/cb" => {
            if let Some(header) = headers.iter().find(|e| e.name == "X-Full-URL") {
                let url = format!("http://localhost:{}/", port);
                let value = String::from_utf8_lossy(header.value);

                if !value.starts_with(&url) {
                    (
                        RequestResult::None,
                        "400 Bad Request",
                        "Invalid Domain".to_string(),
                    )
                } else {
                    (
                        RequestResult::Ok(value.to_string()),
                        "200 Ok",
                        "Ok".to_string(),
                    )
                }
            } else {
                (
                    RequestResult::None,
                    "400 Bad Request",
                    "Missing Header".to_string(),
                )
            }
        }
        _ => (
            RequestResult::None,
            "200 Ok",
            HTTP_RESPONSE.replace("{PORT}", &port.to_string()),
        ),
    };

    conn.write_all(
        format!(
            "HTTP/1.1 {}\r\nContent-Length: {}\r\n\r\n{}",
            status,
            response.len(),
            response
        )
        .as_bytes(),
    )?;
    conn.flush()?;

    Ok(result)
}

pub fn cancel(port: u16) -> Result<(), std::io::Error> {
    // Using tcp instead of something global-ish like an AtomicBool,
    // so we don't have to dive into the set_nonblocking madness.
    let mut stream = TcpStream::connect(SocketAddr::from(([127, 0, 0, 1], port)))?;
    stream.write_all(&EXIT)?;
    stream.flush()?;

    Ok(())
}
