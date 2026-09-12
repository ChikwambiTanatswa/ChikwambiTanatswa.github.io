(function(){
  const termBody = document.getElementById('term-body');
  const termInput = document.getElementById('term-input');
  if(!termBody || !termInput) return; // not on the homepage

  let history = [];
  let historyIndex = -1;

  function printLine(html, cls){
    const div = document.createElement('div');
    div.className = 'line ' + (cls||'');
    div.innerHTML = html;
    termBody.appendChild(div);
    termBody.scrollTop = termBody.scrollHeight;
  }

  const manPages = {
    nmap: "network mapper — port scanning, service/version detection, OS fingerprinting. used for recon against personal ZTE UFi hotspot.",
    metasploit: "exploitation framework — used for Metasploitable2 attack chain (enumeration, exploitation, privesc).",
    n8n: "self-hosted workflow automation, deployed via Docker for small-business client projects.",
    cyberchef: "the 'cyber swiss army knife' — used during CTF work for encoding/decoding and analysis.",
  };

  const commandList = ['help','whoami','ls','cat about.txt','cat contact.txt','man nmap','man metasploit','man n8n','man cyberchef','clear'];

  const commands = {
    help(){
      printLine('available: ' + commandList.map(c => '<span class="err">'+c+'</span>').join(', '), 'out');
    },
    whoami(){
      printLine("Cybersecurity &amp; Network Defense student. Building toward penetration testing / SOC analysis, one home-lab compromise at a time.", 'out');
    },
    ls(){
      printLine('<a href="/projects.html">metasploitable2-writeup/</a>  home-lab/  api-enum-recon/  n8n-automation/', 'out');
    },
    'cat about.txt'(){
      printLine("I believe you can't secure — or break — what you don't understand. This site documents hands-on work and the reasoning behind each technique.", 'out');
    },
    'cat contact.txt'(){
      printLine('email: t.e.chikwambi@proton.me<br>github: github.com/ChikwambiTanatswa', 'out');
    },
    clear(){
      termBody.innerHTML = '';
    }
  };

  function runCommand(raw){
    const cmd = raw.trim();
    printLine('<span class="prompt">guest@chikwambitanatswa:~$</span> ' + cmd);
    if(cmd === '') return;

    if(cmd.startsWith('sudo')){
      printLine('permission denied: nice try', 'err');
      return;
    }
    if(cmd.startsWith('nmap') && cmd !== 'man nmap'){
      printLine('Starting Nmap against chikwambitanatswa.github.io ...<br>PORT 22/tcp   closed  ssh<br>PORT 80/tcp   open    http (this site)<br>PORT 443/tcp  open    https<br>note: static site, nothing to pwn here.', 'out');
      return;
    }
    if(cmd.startsWith('man ')){
      const topic = cmd.slice(4).trim();
      if(manPages[topic]){
        printLine(manPages[topic], 'out');
      } else {
        printLine('No manual entry for ' + topic, 'err');
      }
      return;
    }
    if(commands[cmd]){
      commands[cmd]();
    } else {
      printLine('command not found: ' + cmd + ' — try <span class="err">help</span>', 'err');
    }
  }

  termInput.addEventListener('keydown', (e)=>{
    if(e.key === 'Enter'){
      const val = termInput.value;
      if(val.trim() !== ''){
        history.push(val);
        historyIndex = history.length;
      }
      runCommand(val);
      termInput.value = '';
    } else if(e.key === 'ArrowUp'){
      e.preventDefault();
      if(historyIndex > 0){
        historyIndex--;
        termInput.value = history[historyIndex];
      }
    } else if(e.key === 'ArrowDown'){
      e.preventDefault();
      if(historyIndex < history.length - 1){
        historyIndex++;
        termInput.value = history[historyIndex];
      } else {
        historyIndex = history.length;
        termInput.value = '';
      }
    } else if(e.key === 'Tab'){
      e.preventDefault();
      const partial = termInput.value;
      const match = commandList.find(c => c.startsWith(partial));
      if(match) termInput.value = match;
    }
  });

  window.addEventListener('load', ()=>{
    runCommand('whoami');
    printLine("type <span class=\"err\">help</span> to see what else this thing does", 'out');
  });
})();
