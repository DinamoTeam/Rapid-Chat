using System;
using System.Collections.Generic;

namespace RapidChat.Model
{
    public partial class Peers
    {
        public string PeerId { get; set; }
        public string RoomName { get; set; }

        public Rooms RoomNameNavigation { get; set; }
    }
}
