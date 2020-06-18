using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Rapid_Chat.Data;

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
    }
}