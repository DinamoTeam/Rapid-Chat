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
    public class RoomController
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

        // GET: api/Room/CreateNewRoom
        [HttpGet]
        public async Task<ActionResult<string>> CreateNewRoom()
		{
            string roomName = GenerateRoomName();
            _database.rooms.Add(new Room(roomName));
            await _database.SaveChangesAsync();

            return roomName;
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