using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Rapid_Chat.Data;
using Rapid_Chat.Model;

namespace Rapid_Chat.Controllers
{
    [Route("api/[controller]/[action]")]
    [ApiController]
    public class RoomController: ControllerBase
    {
        private readonly DataContext _database;
        public RoomController(DataContext database)
        {
            _database = database;
        }

        // GET: api/Room/GetPeerIds?roomName=abc
        [HttpGet]
        public async Task<ActionResult<IEnumerable<string>>> GetPeerIds(string roomName)
        {
            return await _database.peers.Where(peer => peer.RoomName == roomName)
                                        .Select(peer => peer.PeerId)
                                        .ToListAsync();
        }

        // GET: api/Room/JoinNewRoom?peerId=abc
        [HttpGet]
        public async Task<ActionResult<string>> JoinNewRoom(string peerId)
		{
            string roomName = GenerateRoomName();
            _database.rooms.Add(new Room(roomName));
            _database.peers.Add(new Peer(peerId, roomName));
            await _database.SaveChangesAsync();

            return roomName;
		}

        // Get: api/Room/JoinExistingRoom?peerId=abc&roomName=def
        [HttpGet]
        public async Task<IActionResult> JoinExistingRoom(string peerId, string roomName)
		{
            var peerIds = _database.peers.Where(p => p.RoomName == roomName)
                                         .Select(p => p.PeerId)
                                         .ToListAsync();
            _database.peers.Add(new Peer(peerId, roomName));
            await _database.SaveChangesAsync();
            return Ok(peerIds);
        }


        private string GenerateRoomName()
        {
            while (true)
            {
                string randomName = Guid.NewGuid().ToString();

                if (_database.rooms.FirstOrDefault(r => r.RoomName == randomName) == null)
                {
                    return randomName;
                }
            }
        }
    }
}