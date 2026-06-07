#!/usr/bin/env python3
import json
import urllib.request
import urllib.parse
import subprocess
import os
import sys
import mimetypes
import ssl
from http.server import HTTPServer, BaseHTTPRequestHandler
from socketserver import ThreadingMixIn

import queue
import threading
from pydbus import SessionBus
from pydbus.generic import signal
from gi.repository import GLib

PORT = 8000
DIRECTORY = os.path.dirname(os.path.realpath(__file__))
import time

# Audio stream URL cache (video_id -> (stream_url, expiry_timestamp))
stream_url_cache = {}
stream_cache_lock = threading.Lock()

mpris_state = {
    'playback_status': 'Stopped',
    'title': '',
    'artist': '',
    'duration_us': 0,
    'art_url': '',
    'track_id': '',
    'volume': 0.7,
    'pending_commands': queue.Queue()
}

class VibeTubeMPRIS(object):
    """
    <node>
        <interface name="org.mpris.MediaPlayer2">
            <method name="Raise"/>
            <method name="Quit"/>
            <property name="CanQuit" type="b" access="read"/>
            <property name="CanRaise" type="b" access="read"/>
            <property name="HasTrackList" type="b" access="read"/>
            <property name="Identity" type="s" access="read"/>
            <property name="SupportedUriSchemes" type="as" access="read"/>
            <property name="SupportedMimeTypes" type="as" access="read"/>
        </interface>
        <interface name="org.mpris.MediaPlayer2.Player">
            <method name="Next"/>
            <method name="Previous"/>
            <method name="Pause"/>
            <method name="PlayPause"/>
            <method name="Stop"/>
            <method name="Play"/>
            <property name="PlaybackStatus" type="s" access="read"/>
            <property name="Metadata" type="a{sv}" access="read"/>
            <property name="Volume" type="d" access="readwrite"/>
            <property name="CanGoNext" type="b" access="read"/>
            <property name="CanGoPrevious" type="b" access="read"/>
            <property name="CanPlay" type="b" access="read"/>
            <property name="CanPause" type="b" access="read"/>
            <property name="CanControl" type="b" access="read"/>
        </interface>
    </node>
    """
    PropertiesChanged = signal()

    def __init__(self, state):
        self.state = state

    def Raise(self):
        pass

    def Quit(self):
        self.state['pending_commands'].put('quit')

    @property
    def CanQuit(self):
        return True

    @property
    def CanRaise(self):
        return False

    @property
    def HasTrackList(self):
        return False

    @property
    def CanGoNext(self):
        return True

    @property
    def CanGoPrevious(self):
        return True

    @property
    def CanPlay(self):
        return True

    @property
    def CanPause(self):
        return True

    @property
    def CanControl(self):
        return True

    @property
    def Identity(self):
        return "VibeTube"

    @property
    def SupportedUriSchemes(self):
        return []

    @property
    def SupportedMimeTypes(self):
        return []

    def Next(self):
        self.state['pending_commands'].put('next')

    def Previous(self):
        self.state['pending_commands'].put('prev')

    def Pause(self):
        self.state['pending_commands'].put('pause')

    def PlayPause(self):
        self.state['pending_commands'].put('playpause')

    def Stop(self):
        self.state['pending_commands'].put('stop')

    def Play(self):
        self.state['pending_commands'].put('play')

    @property
    def PlaybackStatus(self):
        return self.state['playback_status']

    @property
    def Metadata(self):
        meta = {}
        track_id = self.state.get('track_id', '')
        tid = track_id if track_id else 'none'
        # Sanitize to valid D-Bus object path characters (alnum + underscores)
        clean_tid = "".join([c if c.isalnum() or c == '_' else '_' for c in tid])
        track_path = f'/org/mpris/MediaPlayer2/vibetube/track/{clean_tid}'
        
        meta['mpris:trackid'] = GLib.Variant('o', track_path)
        
        if self.state.get('title'):
            meta['xesam:title'] = GLib.Variant('s', self.state['title'])
        if self.state.get('artist'):
            meta['xesam:artist'] = GLib.Variant('as', [self.state['artist']])
        if self.state.get('art_url'):
            meta['mpris:artUrl'] = GLib.Variant('s', self.state['art_url'])
        if self.state.get('duration_us'):
            meta['mpris:length'] = GLib.Variant('x', int(self.state['duration_us']))
        return meta

    @property
    def Volume(self):
        return self.state['volume']

    @Volume.setter
    def Volume(self, value):
        self.state['volume'] = value
        self.state['pending_commands'].put(f'volume:{value}')

mpris_obj = None

def init_mpris():
    global mpris_obj
    try:
        bus = SessionBus()
        mpris_obj = VibeTubeMPRIS(mpris_state)
        bus.publish("org.mpris.MediaPlayer2.vibetube", ("/org/mpris/MediaPlayer2", mpris_obj))
        
        # Start GLib main loop in background thread
        loop = GLib.MainLoop()
        t = threading.Thread(target=loop.run, daemon=True)
        t.start()
        print("MPRIS registered successfully on Session Bus")
    except Exception as e:
        print("Failed to initialize MPRIS:", e)

class ThreadingHTTPServer(ThreadingMixIn, HTTPServer):
    daemon_threads = True

class YTPlayerHandler(BaseHTTPRequestHandler):
    def end_headers(self):
        # Enable CORS for all responses
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Range, Content-Type')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_GET(self):
        parsed_path = urllib.parse.urlparse(self.path)
        path = parsed_path.path
        query = urllib.parse.parse_qs(parsed_path.query)

        # Route API requests
        if path == '/api/search':
            self.handle_search(query)
        elif path == '/api/suggestions':
            self.handle_suggestions(query)
        elif path == '/api/stream':
            self.handle_stream(query)
        elif path == '/api/user_playlist':
            self.handle_user_playlist(query)
        elif path == '/api/user_playlists_list':
            self.handle_user_playlists_list(query)
        elif path == '/api/pre_resolve':
            self.handle_pre_resolve(query)
        elif path == '/api/mpris_update':
            self.handle_mpris_update(query)
        elif path == '/api/mpris_pending':
            self.handle_mpris_pending(query)
        elif path == '/api/lyrics':
            self.handle_lyrics(query)
        else:
            self.handle_static(path)

    def handle_static(self, path):
        # Default to index.html
        if path == '/' or path == '':
            path = '/index.html'

        # Build local file path
        local_path = os.path.join(DIRECTORY, path.lstrip('/'))
        
        # Verify it's within our directory to prevent directory traversal
        real_dir = os.path.realpath(DIRECTORY)
        real_path = os.path.realpath(local_path)
        if not real_path.startswith(real_dir):
            self.send_error(403, "Access Denied")
            return

        if not os.path.exists(local_path) or os.path.isdir(local_path):
            self.send_error(404, "File Not Found")
            return

        # Determine MIME type
        mime_type, _ = mimetypes.guess_type(local_path)
        if mime_type is None:
            mime_type = 'application/octet-stream'

        try:
            with open(local_path, 'rb') as f:
                content = f.read()
            self.send_response(200)
            self.send_header('Content-Type', mime_type)
            self.send_header('Content-Length', str(len(content)))
            self.end_headers()
            self.wfile.write(content)
        except Exception as e:
            self.send_error(500, f"Server Error: {str(e)}")

    def handle_suggestions(self, query):
        q = query.get('q', [''])[0].strip()
        if not q:
            self.send_json([])
            return
        url = f"https://suggestqueries.google.com/complete/search?client=youtube&ds=yt&client=firefox&q={urllib.parse.quote(q)}"
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            context = ssl._create_unverified_context()
            with urllib.request.urlopen(req, context=context, timeout=5) as response:
                data = json.loads(response.read().decode('utf-8'))
                suggestions = data[1] if len(data) > 1 else []
                self.send_json(suggestions)
        except Exception as e:
            print(f"Suggestions error: {e}")
            self.send_json([])

    def handle_search(self, query):
        q = query.get('q', [''])[0].strip()
        if not q:
            self.send_json([])
            return

        try:
            if q.startswith('http://') or q.startswith('https://'):
                search_target = q
            elif q.lower().startswith('sc:') or q.lower().startswith('soundcloud:'):
                real_q = q.split(':', 1)[1].strip()
                search_target = f'scsearch6:{real_q}'
            else:
                search_target = f'ytsearch6:{q}'
                
            cmd = ['yt-dlp', '--remote-components', 'ejs:github', '--js-runtimes', 'node', '--cookies-from-browser', 'firefox', '--ignore-config', '--flat-playlist', '--dump-json', search_target]
            process = subprocess.run(cmd, capture_output=True, text=True, timeout=12)
            
            results = self.parse_json_lines(process.stdout)
            self.send_json(results)
        except subprocess.TimeoutExpired:
            self.send_error(504, "Search Timeout")
        except Exception as e:
            self.send_error(500, f"Search failed: {str(e)}")

    def handle_user_playlist(self, query):
        playlist_type = query.get('type', [''])[0].strip()
        custom_url = query.get('url', [''])[0].strip()
        
        if custom_url:
            url = custom_url
        elif playlist_type == 'liked':
            url = 'https://www.youtube.com/playlist?list=LM'
        elif playlist_type == 'later':
            url = 'https://www.youtube.com/playlist?list=WL'
        elif playlist_type == 'history':
            url = ':ythistory'
        elif playlist_type == 'mix':
            url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=RDMM'
        else:
            self.send_error(400, "Invalid playlist type or missing URL")
            return

        try:
            # Fetch up to 100 tracks (very fast) using browser cookies
            cmd = [
                'yt-dlp', 
                '--remote-components', 'ejs:github',
                '--js-runtimes', 'node',
                '--cookies-from-browser', 'firefox', 
                '--ignore-config',
                '--playlist-end', '100', 
                '--flat-playlist', 
                '--dump-json', 
                url
            ]
            process = subprocess.run(cmd, capture_output=True, text=True, timeout=15)
            
            results = self.parse_json_lines(process.stdout)
            self.send_json(results)
        except Exception as e:
            self.send_error(500, f"Failed to load playlist: {str(e)}")

    def handle_user_playlists_list(self, query):
        try:
            cmd = [
                'yt-dlp', 
                '--remote-components', 'ejs:github',
                '--js-runtimes', 'node',
                '--cookies-from-browser', 'firefox', 
                '--ignore-config',
                '--flat-playlist', 
                '--dump-json', 
                'https://www.youtube.com/feed/playlists'
            ]
            process = subprocess.run(cmd, capture_output=True, text=True, timeout=15)
            
            results = self.parse_json_lines(process.stdout)
            self.send_json(results)
        except subprocess.TimeoutExpired:
            self.send_error(504, "Playlist list loading timed out")
        except Exception as e:
            self.send_error(500, f"Failed to load playlist list: {str(e)}")

    def handle_stream(self, query):
        video_id = query.get('id', [''])[0].strip()
        if not video_id:
            self.send_error(400, "Missing video ID")
            return

        stream_url = None
        # Check cache
        with stream_cache_lock:
            if video_id in stream_url_cache:
                cached_url, expiry = stream_url_cache[video_id]
                if time.time() < expiry:
                    stream_url = cached_url
                else:
                    del stream_url_cache[video_id]

        if not stream_url:
            try:
                # Convert ID to full URL to avoid option parsing issues (e.g. IDs starting with hyphens)
                url_or_id = video_id
                if not (video_id.startswith('http://') or video_id.startswith('https://')):
                    url_or_id = f"https://www.youtube.com/watch?v={video_id}"

                # Use cookies-from-browser to allow streaming of age-restricted or private tracks
                cmd = ['yt-dlp', '--remote-components', 'ejs:github', '--js-runtimes', 'node', '--cookies-from-browser', 'firefox', '--no-playlist', '--ignore-config', '-f', 'ba', '-g', url_or_id]
                process = subprocess.run(cmd, capture_output=True, text=True, timeout=10)
                
                if process.returncode != 0:
                    self.send_error(500, f"Failed to resolve audio: {process.stderr}")
                    return
                    
                stream_url = process.stdout.strip()
                if not stream_url:
                    self.send_error(500, "Empty stream URL resolved")
                    return

                # Cache it for 4 hours
                with stream_cache_lock:
                    stream_url_cache[video_id] = (stream_url, time.time() + 14400)
            except subprocess.TimeoutExpired:
                self.send_error(504, "Resolution Timeout")
                return
            except Exception as e:
                self.send_error(500, f"Error resolving stream: {str(e)}")
                return

        try:
            # Request stream url and copy browser request headers
            req = urllib.request.Request(stream_url)
            
            # Forward Range and User-Agent headers
            if 'Range' in self.headers:
                req.add_header('Range', self.headers['Range'])
            
            req.add_header('User-Agent', self.headers.get('User-Agent', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'))

            # Disable cert verification for safety with CDNs
            ctx = ssl.create_default_context()
            ctx.check_hostname = False
            ctx.verify_mode = ssl.CERT_NONE

            try:
                res = urllib.request.urlopen(req, context=ctx)
            except urllib.error.HTTPError as he:
                self.send_response(he.code)
                self.end_headers()
                return

            # Send back headers
            self.send_response(res.status)
            for header_name in ['Content-Type', 'Content-Length', 'Content-Range', 'Accept-Ranges']:
                val = res.headers.get(header_name)
                if val:
                    self.send_header(header_name, val)
            
            self.end_headers()

            # Pipe stream chunks
            try:
                while True:
                    chunk = res.read(65536)
                    if not chunk:
                        break
                    self.wfile.write(chunk)
            except Exception as pipe_err:
                pass
            finally:
                res.close()
                
        except Exception as e:
            self.send_error(500, f"Stream proxy error: {str(e)}")

    def handle_pre_resolve(self, query):
        video_id = query.get('id', [''])[0].strip()
        if not video_id:
            self.send_error(400, "Missing video ID")
            return

        # Check if already cached
        with stream_cache_lock:
            if video_id in stream_url_cache:
                cached_url, expiry = stream_url_cache[video_id]
                if time.time() < expiry:
                    self.send_json({"status": "cached"})
                    return

        # Run resolution in a background thread so we don't block the caller!
        def bg_resolve(vid):
            try:
                url_or_id = vid
                if not (vid.startswith('http://') or vid.startswith('https://')):
                    url_or_id = f"https://www.youtube.com/watch?v={vid}"

                cmd = ['yt-dlp', '--remote-components', 'ejs:github', '--js-runtimes', 'node', '--cookies-from-browser', 'firefox', '--no-playlist', '--ignore-config', '-f', 'ba', '-g', url_or_id]
                process = subprocess.run(cmd, capture_output=True, text=True, timeout=12)
                if process.returncode == 0:
                    url = process.stdout.strip()
                    if url:
                        with stream_cache_lock:
                            stream_url_cache[vid] = (url, time.time() + 14400)
                        print(f"Pre-resolved video {vid} successfully")
            except Exception as e:
                print(f"Pre-resolution error for {vid}: {e}")

        threading.Thread(target=bg_resolve, args=(video_id,), daemon=True).start()
        self.send_json({"status": "started"})

    def parse_json_lines(self, stdout):
        results = []
        if stdout:
            for line in stdout.strip().split('\n'):
                if not line:
                    continue
                try:
                    data = json.loads(line)
                    video_id = data.get('id')
                    if not video_id:
                        continue
                    
                    webpage_url = data.get('webpage_url', '')
                    original_url = data.get('original_url', '')
                    duration = data.get('duration')
                    
                    # Smart filtering for YouTube Shorts
                    if '/shorts/' in webpage_url or '/shorts/' in original_url:
                        continue
                    if 'soundcloud.com' not in webpage_url and duration and duration <= 60:
                        continue
                    
                    duration = data.get('duration')
                    duration_str = ""
                    if duration:
                        minutes = int(duration // 60)
                        seconds = int(duration % 60)
                        duration_str = f"{minutes}:{seconds:02d}"
                    elif data.get('duration_string'):
                        duration_str = data.get('duration_string')
                    else:
                        duration_str = "Live" if data.get('is_live') else "Unknown"

                    webpage_url = data.get('webpage_url', '')
                    track_id = video_id
                    if 'soundcloud.com' in webpage_url:
                        track_id = webpage_url
                        
                    # Extract the highest resolution thumbnail (Spotify quality)
                    thumbnail = ""
                    if data.get('thumbnails'):
                        valid_thumbs = [t for t in data.get('thumbnails') if t.get('url')]
                        if valid_thumbs:
                            valid_thumbs.sort(key=lambda x: (x.get('width') or 0, x.get('height') or 0))
                            thumbnail = valid_thumbs[-1].get('url', '')

                    if not thumbnail:
                        thumbnail = data.get('thumbnail', '')

                    # Upgrade YouTube thumbnail quality to highres (hqdefault instead of mqdefault/default)
                    if thumbnail and ('youtube.com' in thumbnail or 'ytimg.com' in thumbnail):
                        for low_res in ['/default.jpg', '/mqdefault.jpg']:
                            if low_res in thumbnail:
                                thumbnail = thumbnail.replace(low_res, '/hqdefault.jpg')

                    if not thumbnail:
                        if 'soundcloud.com' in webpage_url:
                            thumbnail = 'https://a-v2.sndcdn.com/assets/images/default_avatar_large-6503c401.png'
                        else:
                            thumbnail = f'https://img.youtube.com/vi/{video_id}/hqdefault.jpg'

                    results.append({
                        'id': track_id,
                        'title': data.get('title', 'Unknown Title'),
                        'channel': data.get('channel', data.get('uploader', 'Unknown Channel')),
                        'duration': duration_str,
                        'thumbnail': thumbnail,
                        'url': data.get('url', webpage_url),
                        'playlist_count': data.get('playlist_count', None)
                    })
                except Exception as json_err:
                    print("JSON parsing error on line:", json_err)
                    continue
        return results

    def send_json(self, data):
        content = json.dumps(data).encode('utf-8')
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(content)))
        self.end_headers()
        self.wfile.write(content)

    def handle_mpris_update(self, query):
        global mpris_obj
        changed = {}
        
        status = query.get('status', [None])[0]
        if status is not None and status != mpris_state['playback_status']:
            mpris_state['playback_status'] = status
            changed['PlaybackStatus'] = status
            
        title = query.get('title', [None])[0]
        if title is not None and title != mpris_state['title']:
            mpris_state['title'] = title
            changed['Metadata'] = None
            
        artist = query.get('artist', [None])[0]
        if artist is not None and artist != mpris_state['artist']:
            mpris_state['artist'] = artist
            changed['Metadata'] = None
            
        duration = query.get('duration', [None])[0]
        if duration is not None:
            try:
                if ":" in duration:
                    parts = duration.split(":")
                    secs = int(parts[0]) * 60 + int(parts[1])
                else:
                    secs = float(duration)
                mpris_state['duration_us'] = int(secs * 1_000_000)
                changed['Metadata'] = None
            except ValueError:
                pass
                
        art_url = query.get('art_url', [None])[0]
        if art_url is not None and art_url != mpris_state['art_url']:
            if art_url.startswith('http'):
                try:
                    cache_dir = os.path.join(DIRECTORY, '.cache')
                    if not os.path.exists(cache_dir):
                        os.makedirs(cache_dir)
                    local_art_path = os.path.join(cache_dir, 'current_art.jpg')
                    
                    req = urllib.request.Request(
                        art_url, 
                        headers={'User-Agent': 'Mozilla/5.0'}
                    )
                    with urllib.request.urlopen(req, timeout=5) as response:
                        with open(local_art_path, 'wb') as f:
                            f.write(response.read())
                    
                    mpris_state['art_url'] = f"file://{local_art_path}"
                except Exception as cache_err:
                    print("Failed to cache MPRIS album art:", cache_err)
                    mpris_state['art_url'] = art_url
            else:
                mpris_state['art_url'] = art_url
            changed['Metadata'] = None
            
        track_id = query.get('id', [None])[0]
        if track_id is not None and track_id != mpris_state['track_id']:
            mpris_state['track_id'] = track_id
            changed['Metadata'] = None
            
        volume = query.get('volume', [None])[0]
        if volume is not None:
            try:
                vol_val = float(volume)
                if abs(vol_val - mpris_state['volume']) > 0.01:
                    mpris_state['volume'] = vol_val
                    changed['Volume'] = vol_val
            except ValueError:
                pass
                
        if changed and mpris_obj is not None:
            dbus_changed = {}
            if 'PlaybackStatus' in changed:
                dbus_changed['PlaybackStatus'] = mpris_state['playback_status']
            if 'Metadata' in changed or changed.get('Metadata') is None:
                dbus_changed['Metadata'] = mpris_obj.Metadata
            if 'Volume' in changed:
                dbus_changed['Volume'] = mpris_state['volume']
                
            try:
                mpris_obj.PropertiesChanged("org.mpris.MediaPlayer2.Player", dbus_changed, [])
            except Exception as ex:
                print("Failed to emit PropertiesChanged signal:", ex)
                
        self.send_json({"status": "ok"})

    def handle_mpris_pending(self, query):
        try:
            cmd = mpris_state['pending_commands'].get(timeout=25)
            self.send_json({"command": cmd})
        except queue.Empty:
            self.send_json({"command": None})

    def handle_lyrics(self, query):
        artist = query.get('artist', [''])[0].strip()
        title = query.get('title', [''])[0].strip()
        if not artist or not title:
            self.send_json({"lyrics": "Не вказано виконавця або назву треку."})
            return

        import re
        def clean_text(text):
            # Remove parentheses/brackets info
            text = re.sub(r'\[.*?\]', '', text)
            text = re.sub(r'\(.*?\)', '', text)
            # Remove common tags
            text = re.sub(r'(?i)official\s+(video|audio|lyrics|mv|visualizer|track)', '', text)
            text = re.sub(r'\s+', ' ', text)
            return text.strip()

        clean_artist = clean_text(artist)
        clean_title = clean_text(title)

        # Try LRCLib API
        try:
            url = f"https://lrclib.net/api/get?artist={urllib.parse.quote(clean_artist)}&track={urllib.parse.quote(clean_title)}"
            req = urllib.request.Request(url, headers={'User-Agent': 'VibeTube/1.0'})
            with urllib.request.urlopen(req, timeout=5) as response:
                data = json.loads(response.read().decode('utf-8'))
                lyrics = data.get('plainLyrics', '')
                synced = data.get('syncedLyrics', '')
                if lyrics or synced:
                    self.send_json({"lyrics": lyrics, "syncedLyrics": synced})
                    return
        except Exception as e:
            print("LRCLib API failed:", e)

        # Try lyrics.ovh API as fallback
        try:
            url = f"https://api.lyrics.ovh/v1/{urllib.parse.quote(clean_artist)}/{urllib.parse.quote(clean_title)}"
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req, timeout=5) as response:
                data = json.loads(response.read().decode('utf-8'))
                lyrics = data.get('lyrics', '')
                if lyrics:
                    self.send_json({"lyrics": lyrics, "syncedLyrics": None})
                    return
        except Exception as e:
            print("Lyrics.ovh API failed:", e)

        self.send_json({"lyrics": "Текст пісні не знайдено.", "syncedLyrics": None})

def main():
    init_mpris()
    server_address = ('', PORT)
    httpd = ThreadingHTTPServer(server_address, YTPlayerHandler)
    print(f"Starting YouTube Equalizer server on http://localhost:{PORT}")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down server...")
        httpd.server_close()
        sys.exit(0)

if __name__ == '__main__':
    main()
